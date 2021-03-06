FROM          taskcluster/centos6-build-upd:0.1.6.20160329195300
MAINTAINER    Dustin J. Mitchell <dustin@mozilla.com>

# Add build scripts; these are the entry points from the taskcluster worker, and
# operate on environment variables
ADD             bin /home/worker/bin
RUN             chmod +x /home/worker/bin/*

# Add wrapper scripts for xvfb allowing tasks to easily retry starting up xvfb
# %include testing/docker/recipes/xvfb.sh
ADD topsrcdir/testing/docker/recipes/xvfb.sh /home/worker/scripts/xvfb.sh

# Add configuration
COPY            dot-config                    /home/worker/.config

# Generate machine uuid file
RUN dbus-uuidgen --ensure=/var/lib/dbus/machine-id

# Stubbed out credentials; mozharness looks for this file an issues a WARNING
# if it's not found, which causes the build to fail.  Note that this needs to
# be in the parent of the workspace directory and in the directory where
# mozharness is run (not its --work-dir).  See Bug 1169652.
ADD           oauth.txt /home/worker/

# stubbed out buildprops, which keeps mozharness from choking
# Note that this needs to be in the parent of the workspace directory and in
# the directory where mozharness is run (not its --work-dir)
ADD           buildprops.json /home/worker/

# install tooltool directly from github where tooltool_wrapper.sh et al. expect
# to find it
RUN wget -O /builds/tooltool.py https://raw.githubusercontent.com/mozilla/build-tooltool/master/tooltool.py
RUN chmod +x /builds/tooltool.py

# Move installation to base centos6-build image once Bug 1272629 is fixed
# Install the screen package here to use with xvfb.
RUN yum install -y screen

# Set a default command useful for debugging
CMD ["/bin/bash", "--login"]
