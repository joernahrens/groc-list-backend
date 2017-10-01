#!/usr/bin/env bash

set -e

cd functions
npm install
cd ..

npm install -g firebase-tools
firebase deploy --token=$FIREBASE_TOKEN --non-interactive --only rules,functions
