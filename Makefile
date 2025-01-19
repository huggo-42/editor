APP_NAME = editai
DOCKER_IMAGE = editai:latest
VERSION = 0.1.0
BUILD_TIME = $(shell date -u '+%Y-%m-%d_%H:%M:%S')
BUILD_OPTIONS := -clean -upx
BUILD_TAGS := 
GO_ENV := GOFLAGS="-buildvcs=false"

WAILS_PATH := $(shell command -v wails 2>/dev/null)

# If Wails is not installed, exit the make process
ifeq ($(WAILS_PATH),)
  $(error Wails is not installed. Please install Wails to proceed.)
endif

# Setup development environment
configure:
	docker compose up -d

dev:
	wails dev

WEBKIT_TAG := $(shell \
	if ! pkg-config --exists webkit2gtk-4.0; then \
		echo "-tags webkit2_41"; \
	else \
		echo ""; \
	fi \
)

# Build development version
build-dev:
	$(GO_ENV) wails build ${WEBKIT_TAG}


# Build for different platforms
build-windows:
	$(GO_ENV) wails build -platform windows/amd64 -nsis ${BUILD_OPTIONS}

build-mac:
	$(GO_ENV) wails build -platform darwin/universal ${BUILD_OPTIONS}

build-linux:
	$(GO_ENV) wails build ${WEBKIT_TAG} -platform linux/amd64 ${BUILD_OPTIONS} && \
		cd build/debian && \
		nfpm pkg --packager deb --target ../bin/ && \
		nfpm pkg --packager rpm --target ../bin/

# Clean up
clean:
	rm -rf build/bin/*
	docker compose down --rmi all

# Update dependencies
tidy:
	docker exec -e $(GO_ENV) editai-dev sh -c "go mod tidy && cd frontend && npm install"

.PHONY: configure build-dev build-windows build-mac build-linux build-linux-static clean tidy
