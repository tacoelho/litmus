# Makefile for building Containers for Storage Testing
# 
# 
# Reference Guide - https://www.gnu.org/software/make/manual/make.html


#
# Internal variables or constants.
# NOTE - These will be executed when any make target is invoked.
#
IS_DOCKER_INSTALLED       := $(shell which docker >> /dev/null 2>&1; echo $$?)

help:
	@echo ""
	@echo "Usage:-"
	@echo "\tmake build             -- will build openebs components"
	@echo "\tmake deps              -- will verify build dependencies are installed"
	@echo ""


_build_check_docker:
	@if [ $(IS_DOCKER_INSTALLED) -eq 1 ]; \
		then echo "" \
		&& echo "ERROR:\tdocker is not installed. Please install it before build." \
		&& echo "" \
		&& exit 1; \
		fi;

deps: _build_check_docker
	@echo ""
	@echo "INFO:\tverifying dependencies for OpenEBS ..."

_build_tests_vdbench_image:
	@echo "INFO: Building container image for performing vdbench tests"
	cd vdbench && docker build -t openebs/tests-vdbench .

_push_tests_vdbench_image:
	@echo "INFO: Publish container (openebs/tests-vdbench)"
	cd vdbench/buildscripts && ./push

_build_tests_fio_image:
	@echo "INFO: Building container image for performing fio tests"
	cd fio && docker build -t openebs/tests-fio .

_push_tests_fio_image:
	@echo "INFO: Publish container (openebs/tests-fio)"
	cd fio/buildscripts && ./push

_build_tests_iometer_image:
	@echo "INFO: Building container image for performing iometer tests"
	cd iometer && docker build -t openebs/tests-iometer .

_push_tests_iometer_image:
	@echo "INFO: Publish container (openebs/tests-iometer)"
	cd iometer/buildscripts && ./push

vdbench: deps _build_tests_vdbench_image _push_tests_vdbench_image

fio: deps _build_tests_fio_image _push_tests_fio_image

iometer: deps _build_tests_iometer_image _push_tests_iometer_image

build: deps vdbench fio iometer


#
# This is done to avoid conflict with a file of same name as the targets
# mentioned in this makefile.
#
.PHONY: help deps build vdbench
.DEFAULT_GOAL := build


