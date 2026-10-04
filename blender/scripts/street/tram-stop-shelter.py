import sys, os
sys.path.append(os.path.dirname(__file__))
from build_batch_4 import build_tram_stop_shelter

if __name__ == '__main__':
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../public/models/street'))
    build_tram_stop_shelter(out_dir)
