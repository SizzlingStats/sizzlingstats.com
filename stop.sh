#!/bin/bash

export PATH="$(npm bin):$PATH"

naught stop

# TODO: Check for zombie processes and warn the user about them
