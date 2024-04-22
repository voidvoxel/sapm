#!/usr/bin/env bash


TEMP_APP_PATH="tmp/app"


# Create a directory to hold a temporary test package.
mkdir -p $TEMP_APP_PATH

# Enter the temporary app directory.
cd $TEMP_APP_PATH

# Install a dependency into the package.
sapm install moment block-stream @voidvoxel/position-3d
