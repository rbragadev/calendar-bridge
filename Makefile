.PHONY: install install-api install-web \
        dev back front \
        migrate migrate-deploy prisma-studio \
        build build-api build-web \
        help

# ── Instalação ────────────────────────────────────────────────────────────────

install: install-api install-web

install-api:
	cd api && npm install && npx prisma generate

install-web:
	cd web && npm install

# ── Desenvolvimento ───────────────────────────────────────────────────────────

back:
	cd api && npx prisma migrate dev && npm run start:dev

front:
	cd web && npm run dev

# ── Banco de dados ────────────────────────────────────────────────────────────

migrate:
	cd api && npx prisma migrate dev

migrate-deploy:
	cd api && npx prisma migrate deploy

prisma-studio:
	cd api && npx prisma studio

# ── Build (produção) ──────────────────────────────────────────────────────────

build: build-api build-web

build-api:
	cd api && npm run build

build-web:
	cd web && npm run build

# ── Help ──────────────────────────────────────────────────────────────────────

help:
	@echo ""
	@echo "  make install         Instala dependências do backend e frontend"
	@echo "  make install-api     Instala só o backend"
	@echo "  make install-web     Instala só o frontend"
	@echo ""
	@echo "  make back            Sobe o backend  (localhost:3000)"
	@echo "  make front           Sobe o frontend (localhost:5173)"
	@echo ""
	@echo "  make migrate         Cria/aplica migrations (dev)"
	@echo "  make migrate-deploy  Aplica migrations (produção)"
	@echo "  make prisma-studio   Abre o Prisma Studio"
	@echo ""
	@echo "  make build           Build completo para produção"
	@echo "  make build-api       Build só do backend"
	@echo "  make build-web       Build só do frontend"
	@echo ""
