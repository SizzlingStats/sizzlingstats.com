#!/bin/bash

# Usage:
# ./start.sh [Number of workers]

# Start 3 cluster workers by default.
# TODO: The number of CPUs should be the max number of workers
NUM_WORKERS=3
NUM_WORKERS=${1:-$NUM_WORKERS}

naught start --worker-count $NUM_WORKERS \
             --stdout log.log \
             --stderr log.log \
             --log log.log \
             app.js
