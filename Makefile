# Variables
COMPOSE		= docker compose
PROJECT		= hw-inventory-api

# Rules
all: up

up:
	@echo "=> Starting $(PROJECT) containers..."
	$(COMPOSE) up -d --build

down:
	@echo "=> Stopping containers..."
	$(COMPOSE) down


clean:
	@echo "=> Cleaning containers and volumes..."
	$(COMPOSE) down -v

fclean: clean
	@echo "=> Deep cleaning Docker system for this project..."
	docker system prune -af


re: clean up

logs:
	$(COMPOSE) logs -f

.PHONY: all up down clean fclean re logs