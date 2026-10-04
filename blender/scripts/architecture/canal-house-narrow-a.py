import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../street')))
from build_batch_3 import build_canal_house_narrow_a

if __name__ == '__main__':
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../public/models/architecture'))
    build_canal_house_narrow_a(out_dir)
