#!/bin/sh

TEMP=".nextjs-effector-installation"

mkdir $TEMP
wget -O $TEMP/archive.zip https://github.com/risenforces/nextjs-effector/archive/refs/heads/release/latest.zip
mkdir $TEMP/extracted/
tar -xf $TEMP/archive.zip -C $TEMP/extracted/
rm -rf $NEXTJS_EFFECTOR_FOLDER
mkdir $NEXTJS_EFFECTOR_FOLDER
cp -R $TEMP/extracted/nextjs-effector-release-latest/library/ $NEXTJS_EFFECTOR_FOLDER
rm -rf $TEMP