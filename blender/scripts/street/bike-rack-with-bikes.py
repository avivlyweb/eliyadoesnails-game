import sys, os
sys.path.append(os.path.dirname(__file__))
from build_batch_1 import build_bike_rack_with_bikes

if __name__ == '__main__':
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../public/models/street'))
    build_bike_rack_with_bikes(out_dir)
