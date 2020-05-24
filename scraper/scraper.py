import json
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from time import sleep, time


# If enabled, check ./data to see if a local cache exists before scraping page
USE_LOCAL_CACHE = True

# Throttle according to robots.txt - https://www.residentadvisor.net/robots.txt
CRAWL_DELAY = 10.0
LAST_REQUEST = time()


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

regions = get_top_regions()
clubs = get_top_clubs(regions)
