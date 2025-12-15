# Build Stage
FROM golang:1.20-alpine AS builder

WORKDIR /app

COPY go.mod ./
# RUN go mod download # Commented out for offline feel, but necessary in real world

COPY . .
RUN go build -o ticket-service main.go

# Runtime Stage
FROM alpine:latest
WORKDIR /root/

COPY --from=builder /app/ticket-service .

EXPOSE 8080

CMD ["./ticket-service"]
