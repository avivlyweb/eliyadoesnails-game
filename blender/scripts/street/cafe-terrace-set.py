import sys, os
sys.path.append(os.path.dirname(__file__))
from build_batch_2 import build_cafe_terrace_set

if __name__ == '__main__':
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../public/models/street'))
    build_cafe_terrace_set(out_dir)
