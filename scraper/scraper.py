import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from time import sleep, time
from datetime import datetime
import re
import pandas as pd


# If enabled, check ./data to see if a local cache exists before scraping page
USE_LOCAL_CACHE = True

# Throttle according to robots.txt - https://www.residentadvisor.net/robots.txt
CRAWL_DELAY = 10.0
LAST_REQUEST = time() - CRAWL_DELAY

RA_IMAGE_PATH = '/images/events/flyer/'

TIME_PATTERN = '(?:[0-9]|0[0-9]|1[0-9]|2[0-3])(?:.|:)*(?:[0-5][0-9])*(?:am|pm)*'
TIME_REGEX = re.compile('({} - {})'.format(TIME_PATTERN, TIME_PATTERN))


def load_local_cache(file_path,  index_col=None):
    """
    Get a data frame if it exists and caching is enabled

    :param file_path (string): Path to the file
    :index_col (string):    The column to index on if any

    :return:    The local cache if it exists and is enabled, an empty data
                frame otherwise
    """
    if USE_LOCAL_CACHE:
        try:
            return pd.read_csv(file_path, comment='#', index_col=index_col)
        except IOError:
            pass
    return pd.DataFrame()


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
    Save the results to ./data/top-regions.csv

    :param count: The number of regions to get

    :return: A list of regions including the following attributes:
            * Name
            * Rank in most popular regions (zero indexed)
            * region the link to regions event page (primary key)
            * Country
    """
    data_path = '../data/top-regions.csv'
    url = 'https://www.residentadvisor.net/events'

    data = load_local_cache(data_path, index_col='region')
    if not data.empty:
        return data

    data = []
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
            'region': link,
            'rank': len(data)
        })

    df = pd.DataFrame(data)
    df.to_csv('../data/top-regions.csv', index=False)
    return df


def get_top_clubs(regions):
    """
    Fetch top clubs for every region. Save the results to ./data/top-clubs.csv

    :param regions (DataFrame): The regions to fetch top clubs for

    :return: A dataframe, each row containing a clubs with the following
    columns:
        * id - Numeric RA id of the club
        * img - Link to a thumbnail for the club
        * name - The clubs name
        * address - The clubs address
        * rank - The rank this club has for this region
        * region - The RA slug for that region
    """

    data_path = '../data/top-clubs.csv'
    data = load_local_cache(data_path, index_col='id')

    for region_index, region in regions.iterrows():
        if region_index not in data.region.unique():
            url = 'https://www.residentadvisor.net{}'.format(region_index)
            content = get_url(url)
            soup = BeautifulSoup(content, 'html.parser')
            popular_clubs = soup.find('div', class_='popularClubs')
            venues = popular_clubs.find('ul', class_='tileListing')

            top_clubs = []
            for index, venue in enumerate(venues.find_all('li')):
                top_clubs.append({
                    'id': venue.get('data-id'),
                    'img': venue.find('img').get('src'),
                    'name': venue.find('h1').get_text().strip(),
                    'address': venue.find('p', class_='copy').get_text(),
                    'rank': index,
                    'region': region_index
                })
            data = data.append(pd.DataFrame.from_records(top_clubs, index='id'))
            data.to_csv(data_path)

    return data


def get_top_club_dates(top_clubs):
    """
    Get overview of all club dates for every club in top_clubs from 2010 to
    2020 Save the results to ./data/top-clubs-dates.csv

    :param top_clubs (DataFrame): The clubs to fetch listings for

    :return: A DataFrame containing dates and overview information for all the
    dates in the top clubs in the period of 2010 to 2020
    """
    data_path = '../data/top-clubs-dates.csv'
    data = load_local_cache(data_path, index_col='id')

    for club_id, club in top_clubs.iterrows():
        if club_id not in data['club_id'].unique():
            for year in range(2010, 2020):
                # for clubs with very few events year pages return duplicate
                # data filter those out
                club_listings = [
                    cl for cl in get_club_year_dates(club_id, year)
                    if not cl['id'] in data.index
                ]
                data.append(club_listings)
            data.to_csv(data_path)

    return data


def get_club_year_dates(club_id, year):
    """
    Get all the dates for a given club on a given year
    Example page:
    https://www.residentadvisor.net/club.aspx?id=237&show=events&yr=2019

    :param club_id: id of the club
    :param year:    year to fetch data for

    :return: list of all the events for that year with the following keys:
        * name of the event
        * date of the event
        * id of the event
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

        img = article.find('img').get('src')
        if img == '/images/clr.gif':
            img = None
        else:
            img = img.replace(RA_IMAGE_PATH, '')

        data.append({
            'date': datetime.strptime(date, '%a, %d %b %Y'),
            'id': int(article.find('a').get('href').replace('/events/', '')),
            'attending': attending,
            'name': article.find('h1').get_text(),
            'img': img,
            'club_id': club_id
        })
    return data


def get_all_dates_details(club_dates, year):
    """
    Get details for all the listings of a club

    :param club_dates (DataFrame): A list of dates to fetch details for
    :param year (string): A year to make file sizes more manageable

    :return: DataFrame for events
    """
    data_path = '../data/date-details-{}.csv'.format(year)
    data = load_local_cache(data_path, index_col='id')

    additions = []
    for index, listing in club_dates.iterrows():
        if index in data.index or pd.to_datetime(listing['date']).year != year:
            continue
        # Only fetch Fridays and Saturdays
        if pd.to_datetime(listing['date']).weekday() in [4, 5]:
            additions.append(get_date_details(index))

            # save csv every 100 events
            if len(additions) % 100 == 0:
                data = data.append(additions)
                data.to_csv(data_path)
                additions = []

    data.to_csv(data_path)
    return data


def get_date_details(listing_id):
    """
    Get the details for a specific listing
    Example page:
    https://www.residentadvisor.net/events/1281396

    :param listing_id: The id of the listing

    :return: Parsed data about that listing. ToDo: add documentation example
    """
    link = 'https://www.residentadvisor.net/events/{}'.format(int(listing_id))
    content = get_url(link)
    soup = BeautifulSoup(content, 'html.parser')

    date = find_and_extract(soup, 'div', 'Date /', TIME_REGEX, text=False)
    start_time, end_time = extract_datetimes(date)

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
        print('No line up found for {}'.format(listing_id))

    flyers = []
    flyer = event_item.find('div', class_='flyer')
    if flyer:
        for img in flyer.find_all('img'):
            flyers.append(img.get('src').replace(RA_IMAGE_PATH, ''))

    data = {
        'id': listing_id,
        'start_time': start_time if start_time else None,
        'end_time': end_time if end_time else None,
        'cost': cost,
        'age': age,
        'promoters': promoters,
        'flyers': flyers,
        'artists': artists,
        'pick': True if soup.find('div', class_='pick-icon') else False,
        'attending': int(soup.find('h1', id='MembersFavouriteCount').get_text())
    }
    return data


def find_and_extract(soup, tag, search_string, regex, text=True):
    """
    Check if a tag containing the string_match exists in soup, if so check for
    matches of the regex within the parent element and return them if they exist

    :param soup:    BeautifulSoup tree
    :param tag:     Which kind of html tag to search for
    :param search_string:  The string contents of that tag
    :param regex:   Regex for the attribute that we are after
    :param text:    Whether to search in all text of the element or not

    :return: The first match if any exists.
    """
    elem = soup.find(tag, string=search_string)
    if elem:
        if text:
            t = elem.parent.get_text()
        else:
            strings = [e for e in elem.parent.children if isinstance(e, str)]
            t = ','.join(strings)
        match = regex.search(t)
        if match and match.groups():
            return match.groups()[0]
    return None


def extract_datetimes(date_string):
    if not date_string:
        return [None, None]
    times = date_string.split(' - ')
    for index, t in enumerate(times):
        t = t.replace('.', ':')
        pm = True if 'pm' in t else False
        t = t.replace('pm', '').replace('am', '')
        if ':' in t:
            hours, minutes = t.split(':')
        else:
            hours = t
            minutes = '00'
        hours = hours.zfill(2)
        if pm and int(hours) < 12:
            hours = int(hours) + 12
        t = '{}:{}'.format(hours, minutes)
        times[index] = t
    return times
