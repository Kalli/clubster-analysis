import pandas as pd
import glob
from ast import literal_eval
from collections import Counter
import networkx as nx
from networkx.readwrite import json_graph
import json
import numpy as np

# Processes and parses the raw data from scraper into the networks and data
# that we want to graph


class NaNCounter(Counter):
    """
    A counter that excludes nan values
    """
    def update(self, *args, **kwds):
        if isinstance(args[0], pd.Series):
            args = (args[0].dropna(),)
        super(NaNCounter, self).update(*args, **kwds)


def load_csv_files():
    """
    Loads csv files of all the raw data from the scraper
    """
    regions = pd.read_csv('./data/top-regions.csv')
    clubs = pd.read_csv('./data/top-clubs.csv', index_col='id').fillna('')
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

    attending = all_data.drop_duplicates(
        'id_date'
    ).groupby(
        ['year', 'name_club']
    ).agg(
        attending=('attending', 'sum')
    )

    by_year_and_club = all_data.groupby(['year', 'name_club']).agg(
        club_id=('id_club', 'first'),
        name_region=('name_region', 'first'),
        logo=('img', 'first'),
        number_of_dates=('id_date', pd.Series.nunique),
        number_of_unique_artists=('artist_name', pd.Series.nunique),
        total_number_of_artists=('artist_name', 'count'),
        artists=('artist_name', NaNCounter),
        followers=('followers', 'first'),
        capacity=('capacity', 'first'),
    )

    return by_year_and_club.join(attending)


def calculate_club_likeness(club_data):
    """
    Calculate the Jaccard index for each pair of clubs in club data
    return as a list of lists with each list containing:
        [source, target, jaccard_score]
    """
    similarities = []
    size = len(club_data)
    for i in range(0, size):
        club1 = club_data.iloc[i]
        for j in range(i+1, size):
            club2 = club_data.iloc[j]
            similarity = jaccard_index(club1.artists, club2.artists)
            similarities.append((club1.name[1], club2.name[1], similarity))
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
    if len(union) == 0:
        return 0
    else:
        return len(intersection) / len(union)


def create_graph(nodes, edges):
    G = nx.Graph()

    for (year, club_name), data in nodes.iterrows():
        G.add_node(club_name, **data.to_dict())

    G.add_weighted_edges_from(edges)

    return G


def artist_id_to_name_dict(all_data):
    """
    For most artists their id is a slugified version of their name
    But there are exceptions, keep track of those
    """

    artist_name_to_ids = all_data.loc[:, 'artist_id':'artist_name']. \
        drop_duplicates().set_index('artist_name').to_dict()['artist_id']
    d = {}
    for artist_name, artist_id in artist_name_to_ids.items():
        if artist_id is not np.nan:
            if artist_id != artist_name.lower().replace(' ', ''):
                    d[artist_name] = artist_id

    return d


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

    all_data = all_data.reset_index()
    club_data = group_by_year_and_club(all_data)
    club_data.logo = club_data.logo.fillna('')
    artist_name_to_ids = artist_id_to_name_dict(all_data)

    for year, df in club_data.groupby(level=0):
        similarities = calculate_club_likeness(df)
        G = create_graph(df, similarities)
        d = json_graph.node_link_data(G)
        d['artist_names_to_ids'] = artist_name_to_ids
        json.dump(d, open('./public/network-{}.json'.format(year), 'w'))