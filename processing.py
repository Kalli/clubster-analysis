import pandas as pd
import glob
from ast import literal_eval
from collections import Counter
import networkx as nx
from networkx.readwrite import json_graph
import json


# Processes and parses the raw data from scraper into the networks and data
# that we want to graph

SIMILARITY_THRESHOLD = 0


def load_csv_files():
    """
    Loads csv files of all the raw data from the scraper
    """
    regions = pd.read_csv('./data/top-regions.csv')
    clubs = pd.read_csv('./data/top-clubs.csv', index_col='id')
    dates = pd.read_csv(
        './data/top-clubs-dates.csv',
        index_col='id',
        parse_dates=['date']
    )
    all_files = glob.glob(r'./data/date-details-201*.csv')

    li = []
    for filename in all_files:
        df = pd.read_csv(filename, index_col='id', header=0)
        li.append(df)

    date_details = pd.concat(li, axis=0)

    # artists are saved as list representations of lists
    date_details.artists = date_details.artists.apply(lambda x: literal_eval(x))

    return regions, clubs, dates, date_details


def normalize_artist_data(date_details):
    """
    Normalizes artist data into their own data frame, to be joined on
    event_id
    """
    artists_to_dates_list = []
    for date_id, row in date_details.iterrows():
        for artist_id, artist_name in row['artists']:
            artists_to_dates_list.append([date_id, artist_id, artist_name])

    artists_to_dates = pd.DataFrame.from_records(
        artists_to_dates_list,
        columns=['event_id', 'artist_id','artist_name']
    )
    artists_to_dates = artists_to_dates.set_index('event_id')

    return artists_to_dates


def join_data_frames(regions, clubs, dates, date_details, artists_to_dates):
    """
    Join all the data frames into one big "table"
    """

    # join regions and clubs
    regions_top_clubs = regions.join(
        clubs.reset_index().set_index('region'),
        on='region',
        lsuffix='_region',
        rsuffix='_club'
    )

    # Join top clubs and regions to club dates.
    regions_top_club_dates = regions_top_clubs.join(
        dates.reset_index().set_index('club_id'),
        on='id',
        rsuffix='_date'
    )

    regions_top_club_dates = regions_top_club_dates.rename(
        columns={'id': 'id_club'}
    )

    # join with date details
    regions_top_club_dates_details = regions_top_club_dates.set_index(
        'id_date'
    ).join(
        date_details,
        rsuffix='date_detail',
        # date details only contain a subset of events (fridays and saturdays)
        # so exclude all other rows
        how='inner'
    )

    all_data = regions_top_club_dates_details.join(
        artists_to_dates,
        rsuffix='artists',
        how='inner'
    ).drop_duplicates()

    all_data.index.name = 'id_date'

    # dumps the data so we can read the local cache if it exists
    all_data.to_csv('./data/all_data.csv')

    return all_data


def group_by_year_and_club(all_data):
    """
    Group all data by years and clubs
    """
    all_data['year'] = all_data['date'].map(lambda x: x.year)
    return all_data.groupby(
        [all_data['year'], all_data['name_club']],
    ).artist_name.value_counts().reset_index(name='count')


def create_club_lineup_counts(club_data):
    """
    Reduce a dataframe of club line ups into a dictionary keyed by club names,
    with the values

    Example:

        "fabric": {
            "Craig Richards": 10,
            "John Tejada": 1,
        }

    """
    data = {}
    for _, r in club_data.iterrows():
        club, artist, count = r['name_club'], r['artist_name'], r['count']
        if club in data:
            data[club][artist] = count
        else:
            data[club] = {
                artist: count
            }
    return data


def calculate_club_likeness(club_data):
    """
    Calculate the Jaccard index for each pair of clubs in club data
    return as a list of lists with each list containing:
        [source, target, jaccard_score]
    """
    similarities = []
    keys = list(club_data.keys())
    for i, k1 in enumerate(keys):
        for k2 in keys[i+1:]:
            similarity = jaccard_index(data[k1], data[k2])
            if similarity > SIMILARITY_THRESHOLD:
                similarities.append((k1, k2, similarity))
    return similarities


def jaccard_index(a, b):
    """
    Calculates the Jaccard index for two multisets described by dictionaries
    where the keys are the names of the entries and the values are the number
    of times they are included in the set

    https://en.wikipedia.org/wiki/Jaccard_index
    """
    intersection = list((Counter(a) & Counter(b)).elements())
    union = list((Counter(a) | Counter(b)).elements())
    return len(intersection) / len(union)


def create_graph(data, edges):
    G = nx.Graph()

    for k, v in data.items():
        artists = len(v.keys())
        appearances = sum(v.values())
        G.add_node(k, size=appearances, artists=artists)

    G.add_weighted_edges_from(edges)

    return G


if __name__ == "__main__":

    try:
        # check if we have already combined all the raw data into a csv
        all_data = pd.read_csv(
            './data/all_data.csv',
            index_col='id_date',
            parse_dates=['date']
        )
    except (IOError, pd.errors.EmptyDataError):
        # otherwise load and save
        regions, clubs, dates, date_details = load_csv_files()
        artists_to_dates = normalize_artist_data(date_details)
        date_details = date_details.drop('artists', axis=1)
        all_data = join_data_frames(
            regions, clubs, dates, date_details, artists_to_dates
        )

    year_club_artist_counts = group_by_year_and_club(all_data)
    for year in year_club_artist_counts.year.unique():
        d = year_club_artist_counts[year_club_artist_counts['year'] == year]
        data = create_club_lineup_counts(d)
        similarities = calculate_club_likeness(data)
        G = create_graph(data, similarities)
        d = json_graph.node_link_data(G)
        json.dump(d, open('./public/network-{}.json'.format(year), 'w'))