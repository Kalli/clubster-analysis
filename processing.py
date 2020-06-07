import pandas as pd
import glob
from ast import literal_eval

# Processes and parses the raw data from scraper into the networks and data
# that we want to graph


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