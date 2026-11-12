#!/bin/bash
# Drives the fh-jobs and fh-roles workers and prints one line per call.
#   scripts/run-jobs.sh vc accel menlo     import these VC boards' company lists
#   scripts/run-jobs.sh ats                look for job boards, 25 companies a call, until none is left
#   scripts/run-jobs.sh tag                tag postings with the current skill vocabulary, 300 a call, until none is left
#   scripts/run-jobs.sh roles              label postings with a family and a level from the title, 500 a call, until
#                                          none is left; the last call recounts the tags. Run it after every import
# The worker's address is public and needs no key: a call only re-reads public lists.
# After a run, read the real row counts from the database; do not add up this output.
set -u
BASE="https://huhlnktlxocphsejyjpm.supabase.co/functions/v1"
URL="$BASE/fh-jobs"
BATCH=25
MAX_CALLS=500

call() { curl -s -m 170 -X POST "$URL" -H 'Content-Type: application/json' -d "$1"; }

case "${1:-}" in
  vc)
    shift
    [ $# -gt 0 ] || { echo "name at least one board" >&2; exit 2; }
    for board in "$@"; do
      echo "vc $board $(call '{"task":"vc","board":"'"$board"'"}')"
    done
    ;;
  ats)
    empty=0
    for i in $(seq 1 "$MAX_CALLS"); do
      result=$(call '{"task":"ats","limit":'"$BATCH"'}')
      echo "ats $i $result"
      case "$result" in
        *'"ok":false'*) echo "stopped: the worker reported a failure" >&2; exit 1 ;;
        *'"claimed":0'*) empty=$((empty + 1)) ;;
        *) empty=0 ;;
      esac
      [ "$empty" -ge 2 ] && break
      sleep 1
    done
    echo "done"
    ;;
  tag)
    for i in $(seq 1 "$MAX_CALLS"); do
      result=$(call '{"task":"tag","limit":300}')
      echo "tag $i $result"
      case "$result" in
        *'"ok":false'*) echo "stopped: the worker reported a failure" >&2; exit 1 ;;
        *'"tagged":0'*) break ;;
      esac
    done
    echo "done"
    ;;
  roles)
    for i in $(seq 1 "$MAX_CALLS"); do
      result=$(curl -s -m 170 -X POST "$BASE/fh-roles" -H 'Content-Type: application/json' -d '{"limit":500}')
      echo "roles $i $result"
      case "$result" in
        *'"ok":false'*) echo "stopped: the worker reported a failure" >&2; exit 1 ;;
        *'"done":true'*) break ;;
      esac
    done
    echo "done"
    ;;
  *)
    echo "usage: scripts/run-jobs.sh vc <board>... | ats | tag | roles" >&2
    exit 2
    ;;
esac
