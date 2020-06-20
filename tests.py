import unittest
from processing import jaccard_index, NaNCounter
import numpy as np
import pandas as pd


class ProcessingTest(unittest.TestCase):

    def test_jaccard_index(self):
        """
        Verify that Jaccard index returns the expected results for different
        data types.
        """
        a = ['a', 'b', 'c', 'd']
        b = ['e', 'f', 'g', 'h']

        msg = 'Should have no common elements'
        self.assertEqual(0.0, jaccard_index(a, b), msg=msg)

        a = ['a', 'b', 'c', 'd', 'e']
        b = ['d', 'e', 'f', 'g', 'h']

        msg = '|Intersection|=2, |Union|=5+5-2'
        self.assertEqual(2/8, jaccard_index(a, b), msg=msg)

        # should work with dictionaries as well
        a = {'a': 2, 'b': 1, 'c': 1, 'd': 1, 'e': 3}
        b = {'c': 1, 'd': 2, 'e': 2, 'f': 1, 'g': 1, 'h': 1}
        msg = '|Intersection|=4, |Union|=8+8-4=12'
        self.assertEqual(4/12, jaccard_index(a, b), msg=msg)

        a = [i for i in range(0, 10)]
        b = [i for i in range(0, 5)]
        msg = '|Intersection|=5, |Union|=10+5-5=10'
        self.assertEqual(5/10, jaccard_index(a, b), msg=msg)

    def test_nan_counter(self):
        """
        Test that the NaNCounter class works as expected
        """
        data = [1, 2, 3, 4, np.nan, np.nan]
        counter = NaNCounter(pd.Series(data))
        msg = "nans should be excluded from the counter"
        self.assertEqual(len(data) - 2, len(counter.keys()), msg=msg)


if __name__ == '__main__':
    unittest.main()
