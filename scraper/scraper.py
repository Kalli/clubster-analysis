import json

# If enabled, check ./data to see if a local cache exists before scraping page
USE_LOCAL_CACHE = True

def load_local_cache(path_to_json):
    if not USE_LOCAL_CACHE:
        try:
            with open(path_to_json, 'r') as fp:
                data = json.load(fp)
        except IOError:
            data = {}
    else:
        data = {}
    return data