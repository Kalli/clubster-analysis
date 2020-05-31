from scraper import get_listing_details
from unittest import TestCase


class ScraperTest(TestCase):

    def test_get_listing_details(self):
        data = get_listing_details('/events/1281396')
        expected_data = {
            'start_time': '23:00',
            'end_time': '06:00',
            'cost': None,
            'age': '19+',
            'promoters': [
                ['967', 'fabric'],
                ['28605', 'JR Events'],
                ['68697', 'FABRICLIVE']
            ],
            'flyers': [
                '/images/events/flyer/2019/11/uk-1129-1281396-1527425-front.jpg',
                '/images/events/flyer/2019/11/uk-1129-1281396-1527425-back.jpg'
            ],
            'attending': 672,
            'artists': [
                ['spectrasoul', 'SpectraSoul'], ['breakage', 'Breakage'],
                ['technimatic-uk', 'Technimatic'], ['icicle', 'Icicle'],
                ['edit-de', 'Ed:it'], ['glxy', 'GLXY'],
                ['lowqui', 'LowQui'], ['visionobi', 'Visionobi'],
                ['phace', 'Phace'], ['misanthrop', 'Misanthrop'],
                ['halogenix', 'Halogenix'], ['lxone', 'LX one'],
                ['djpatife', 'DJ Patife']
            ],
            'pick': False
        }

        self.assertEqual(expected_data, data)
