# Stage 1: Build the Go binary
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Copy go.mod and go.sum first to leverage Docker cache
# The build context is this directory (apps/main-api), so paths are relative
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the application source code
COPY . .

# Build the application binary
# CGO_ENABLED=0 disables Cgo, needed for static linking often useful in containers
# -ldflags="-s -w" strips debug information, reducing binary size
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o main cmd/api/main.go

# Stage 2: Create the final lightweight image
FROM alpine:latest

WORKDIR /app

# Copy the built binary from the builder stage
COPY --from=builder /app/main .

# Expose the port the app will listen on (will be set via env var)
# Fly.io typically uses 8080 internally
EXPOSE 8080

# Command to run the application
# The actual port will be determined by the MAIN_API__PORT env variable set via fly secrets
CMD ["/app/main"]
