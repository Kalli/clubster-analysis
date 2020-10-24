import pandas as pd
from ast import literal_eval
from collections import Counter
import networkx as nx
from networkx.readwrite import json_graph
import json
import numpy as np
import community as community_louvain
from scipy import stats

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

    date_details = pd.read_csv(
        r'./data/date-details-2019.csv',
        index_col='id',
        header=0
    )

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
        region=('name_region', 'first'),
        country=('country', 'first'),
        logo=('img', 'first'),
        number_of_dates=('id_date', pd.Series.nunique),
        rank=('rank_club', 'first'),
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
            if similarity > 0:
                similarities.append((club1.name[1], club2.name[1], similarity))
    return similarities


def jaccard_index(a, b):
    """
    Calculates the Jaccard index for two multisets described by dictionaries
    where the keys are the names of the entries and the values are the number
    of times they are included in the set

    https://en.wikipedia.org/wiki/Jaccard_index
    """
    intersection = len(list((Counter(a) & Counter(b)).elements()))
    union = sum(Counter(a).values()) + sum(Counter(b).values()) - intersection
    if union == 0:
        return 0
    else:
        return intersection / union


def create_graph(nodes, edges):
    G = nx.Graph()

    for (year, club_name), data in nodes.iterrows():
        G.add_node(club_name, **data.to_dict())

    G.add_weighted_edges_from(edges)
    partition = community_louvain.best_partition(G)
    for key, value in partition.items():
        G.nodes[key]["group"] = value

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


def optimise_json(d):
    """
    Change dictionaries into lists to optimise space in json.
    Convert back in js.
    """
    d['node_keys'] = list(d['nodes'][0].keys())
    for i, node in enumerate(d['nodes']):
        d['nodes'][i] = list(node.values())

    d['link_keys'] = list(d['links'][0].keys())
    for i, link in enumerate(d['links']):
        d['links'][i] = list(link.values())
    return d


def residency_factor(club):
    if club['number_of_unique_artists'] == 0:
        return 0
    return club['total_number_of_artists'] / club['number_of_unique_artists']


def compare_underlying_distribution(clubs, calculation, aggregation):
    t = []
    aggregate_values = set()
    for club in clubs:
        t.append([
            club[aggregation],
            calculation(club)
        ])
        aggregate_values.add(club[aggregation])

    for key in aggregate_values:
        n1 = [a[1] for a in t if a[0] == key]
        n2 = [a[1] for a in t if a[0] != key]
        a = stats.ks_2samp(n1, n2)
        if a[1] <= 0.01:
            print(f'{key} is likely not from the same distribution')
        else:
            print(f'{key}')


if __name__ == "__main__":

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

        compare_underlying_distribution(
            d['nodes'], residency_factor, 'region'
        )
        d = optimise_json(d)
        json.dump(d, open('./public/network-{}.json'.format(year), 'w'))