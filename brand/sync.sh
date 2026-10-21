#!/usr/bin/env bash
# Copy the brand kit into the website so it is served at /brand/.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
dest="$here/../web/public/brand"
rm -rf "$dest" && mkdir -p "$dest"
cp -r "$here/svg" "$here/png" "$here/index.html" "$here/email-signature.html" "$dest/"
echo "synced brand kit to $dest"
