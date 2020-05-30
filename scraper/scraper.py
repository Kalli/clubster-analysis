import json
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from time import sleep, time
from datetime import datetime
import re

# If enabled, check ./data to see if a local cache exists before scraping page
USE_LOCAL_CACHE = True

# Throttle according to robots.txt - https://www.residentadvisor.net/robots.txt
CRAWL_DELAY = 10.0
LAST_REQUEST = time() - CRAWL_DELAY

TIME_PATTERN = '(?:[0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]'
TIME_REGEX = re.compile('({} - {})'.format(TIME_PATTERN, TIME_PATTERN))

def load_local_cache(path_to_json, type_='dict'):
    """
    Get local cache if it exists and caching is enabled

    :param path_to_json: Path to the file
    :param type_:         Type for the file (to default to if cache empty)

    :return:    The local cache if it exists and is enabled, an empty data
                structure otherwise
    """
    data = {} if type_ == 'dict' else []
    if USE_LOCAL_CACHE:
        try:
            with open(path_to_json, 'r') as fp:
                data = json.load(fp)
        except (IOError, json.decoder.JSONDecodeError):
            pass
    return data


def get_url(url):
    """
    Get the contents of a url. Check for local cache in ./html if it exists and
     caching is enabled. Save the results to the cache if the file did not exist

    :param url:     The url to fetch contents for

    :return: String representation of the contents.
    """
    global LAST_REQUEST
    content = ''
    parsed_url = urlparse(url)
    path = '../html/{}-{}-{}.html'.format(
        parsed_url.netloc,
        parsed_url.path[1:].replace('/', '-'),
        parsed_url.query
    ).replace('--', '-')
    if USE_LOCAL_CACHE:
        try:
            with open(path, 'r') as fp:
                content = fp.read()
        except IOError:
            pass
    if not content:
        wait = (time() - LAST_REQUEST)
        if wait < CRAWL_DELAY:
            print('Sleeping for {} seconds'.format(CRAWL_DELAY - wait))
            sleep(CRAWL_DELAY - wait)
            LAST_REQUEST = time()
        r = requests.get(url)
        if r.status_code == 200:
            with open(path, 'w+') as fp:
                fp.write(r.text)
            content = r.content
    return content


def get_top_regions():
    """
    Get top regions from RAs event page https://www.residentadvisor.net/events
    Save the results to ./data/regions.json

    :param count: The number of regions to get

    :return: A list of regions including the following attributes:
            * Name
            * Rank in most popular regions (zero indexed)
            * Link to regions event page
            * Country
    """
    data_path = '../data/regions.json'
    url = 'https://www.residentadvisor.net/events'

    data = load_local_cache(data_path, 'list')
    if data:
        return data

    content = get_url(url)
    soup = BeautifulSoup(content, 'html.parser')
    regions_section = soup.find_all('section', class_='top-list')[1]
    regions_list = regions_section.find('ul')

    for region in regions_list.find_all('li'):
        text = region.get_text()
        link = region.find('a').get('href')

        # text is in following format:
        # Name, Country /
        # Unless the region is an entire country, in which case it is:
        # Name /
        elements = [t.strip() for t in text.replace(' /', '').split(',')]
        if len(elements) == 2:
            name, country = elements
        else:
            name, country = elements[0], elements[0]

        data.append({
            'name': name,
            'country': country,
            'link': link,
            'rank': len(data)
        })

    with open(data_path, 'w+') as fp:
        json.dump(data, fp)

    return data


def get_top_clubs(regions):
    """
    Fetch top clubs for every region
    Save the results to ./data/top-clubs.json

    :param regions: The regions to fetch top clubs for

    :return: A dictionary, keyed by region links, each entry containing a list
    of popular clubs with the following keys:
        * id - Numeric RA id of the club
        * img - Link to a thumbnail for the club
        * name - The clubs name
        * address - The clubs address
        * rank - The rank this club has for this region
    """

    data_path = '../data/top-clubs.json'
    data = load_local_cache(data_path, 'dict')

    for region in regions:
        if region['link'] not in data:
            region_data = []
            url = 'https://www.residentadvisor.net{}'.format(region['link'])
            content = get_url(url)
            soup = BeautifulSoup(content, 'html.parser')
            popular_clubs = soup.find('div', class_='popularClubs')
            venues = popular_clubs.find('ul', class_='tileListing')
            for venue in venues.find_all('li'):
                region_data.append({
                    'id': venue.get('data-id'),
                    'img': venue.find('img').get('src'),
                    'name': venue.find('h1').get_text().strip(),
                    'address': venue.find('p', class_='copy').get_text(),
                    'rank': len(region_data)
                })
            data[region['link']] = region_data
        with open(data_path, 'w+') as fp:
            json.dump(data, fp)

    return data


def get_club_listings(top_clubs):
    """
    Get overview of all club listings for every club in top clubs from 2010 to
    2020 Save the results to ./data/club-dates.json

    :param top_clubs: The clubs to fetch listings for

    :return: A dictionary, keyed by club ids, and then by years, each year
    containing all the listings for that year
    """
    data_path = '../data/club-dates.json'
    data = load_local_cache(data_path, 'dict')

    clubs = [club for region in top_clubs.values() for club in region]

    for club in clubs:
        club_id = club['id']
        if club_id not in data:
            club_dates = {}
        else:
            club_dates = data[club_id]

        for year in range(2010, 2020):
            if str(year) not in club_dates:
                club_dates[year] = get_club_year_listings(club_id, year)
                data[club_id] = club_dates
                # Save data for every year fetched in case of exceptions
                with open(data_path, 'w+') as fp:
                    json.dump(data, fp)

    return data


def get_club_year_listings(club_id, year):
    """
    Get all the listings for a given club on a given year
    Example page:
    https://www.residentadvisor.net/club.aspx?id=237&show=events&yr=2019

    :param club_id: id of the club
    :param year:    year to fetch data for

    :return: list of all the events for that year with the following keys:
        * name of the event
        * date of the event
        * link to a detail page for the event
        * img link to a thumbnail for that event
        * attending the number of users that attended the event
    """
    data = []
    url = 'https://www.residentadvisor.net/club.aspx?id={}&show=events&yr={}'
    content = get_url(url.format(club_id, year))
    soup = BeautifulSoup(content, 'html.parser')
    articles = soup.find_all('article')
    for article in articles:
        date_element = article.find('p', class_='date')
        if not date_element:
            continue
        date = date_element.get_text()
        counter = article.find('p', class_='counter')
        attending = int(counter.find('span').get_text()) if counter else 0

        data.append({
            'date': datetime.strptime(date, '%a, %d %b %Y').isoformat(),
            'link': article.find('a').get('href'),
            'attending': attending,
            'name': article.find('h1').get_text(),
            'img': article.find('img').get('src')
        })
    return data


def get_all_listing_details(club_listings):
    """
    Get details for all the listings of a club

    :param club_listings: Overview of the listings to fetch details for

    :return: dictionary mapping event ids to event details
    """
    data_path = '../data/listing-details.json'
    data = load_local_cache(data_path, 'dict')

    for club_id, years in club_listings.items():
        for year, listings in years.items():
            for listing in listings:
                link = listing['link']
                if link not in data:
                    data[link] = get_listing_details(link)
    return data


def get_listing_details(listing_link):
    """
    Get the details for a specific listing
    Example page:
    https://www.residentadvisor.net/events/1281396

    :param listing_link: The link to the list

    :return: Parsed data about that listing. ToDo: add documentation example
    """
    content = get_url('https://www.residentadvisor.net{}'.format(listing_link))
    soup = BeautifulSoup(content, 'html.parser')

    date = find_and_extract(soup, 'div', 'Date /', TIME_REGEX)
    start_time, end_time = date.split(' - ') if date else [None, None]

    cost = find_and_extract(soup, 'div', 'Cost /', re.compile('Cost /(.*)'))
    age = find_and_extract(
        soup,
        'div',
        'Minimum age /',
        re.compile('Minimum age /(.*)')
    )

    promoters = []
    promoter_tag = soup.find('div', text='Promoters /')
    if promoter_tag:
        for promoter in promoter_tag.parent.find_all('a'):
            link = promoter.get('href')
            if '/promoter.aspx?id=' in link:
                promoters.append([
                    link.replace('/promoter.aspx?id=', ''),
                    promoter.get_text()
                ])

    event_item = soup.find('div', id='event-item')

    artists = []
    lineup = event_item.find('p', class_='lineup')
    if lineup:
        lineup_links = lineup.find_all('a')
        for lineup_link in lineup_links:
            href = lineup_link.get('href')
            if href.startswith('/dj/'):

                artists.append([
                    href.replace('/dj/', ''),
                    lineup_link.get_text()
                ])

    else:
        print('No line up found for {}'.format(listing_link))

    flyers = []
    flyer = event_item.find('div', class_='flyer')
    if flyer:
        for img in flyer.find_all('img'):
            flyers.append(img.get('src'))

    data = {
        'start_time': start_time if start_time else None,
        'end_time': end_time if end_time else None,
        'cost': cost,
        'age': age,
        'promoters': promoters,
        'flyers': flyers,
        'artists': artists,
        'attending': int(soup.find('h1', id='MembersFavouriteCount').get_text())
    }
    return data


def find_and_extract(soup, tag, search_string, regex):
    """
    Check if a tag containing the string_match exists in soup, if so check for
    matches of the regex within the parent element and return them if they exist

    :param soup:    BeautifulSoup tree
    :param tag:     Which kind of html tag to search for
    :param search_string:  The string contents of that tag
    :param regex:   Regex for the attribute that we are after

    :return: The first match if any exists.
    """
    elem = soup.find(tag, string=search_string)
    if elem:
        match = regex.search(elem.parent.get_text())
        if match and match.groups():
            return match.groups()[0]
    return None

regions = get_top_regions()
clubs = get_top_clubs(regions)
dates = get_club_listings(clubs)
