#!/bin/sh
LOGS=/var/log/update_script.log
echo "############################" >> $LOGS
echo $(date) >> $LOGS
echo "############################" >> $LOGS

sudo apt-get update >> $LOGS && sudo apt-get upgrade >> $LOGS
