# HealthTrackPro
 
# HealthTrack Pro - Système de surveillance des maladies cronique.

Une application full-stack de gestion médicale avec frontend React et backend Spring Boot, conteneurisée avec Docker.

## Fonctionnalités

- **Tableau de bord patient** : Suivi des rendez-vous, médicaments et indicateurs de santé
- **Espace professionnel** : Gestion des dossiers patients et plannings
- **Suivi médical** : Surveillance des constantes 
- **Accès sécurisé** : Système d'authentification par rôles
- **Design responsive** : Compatible desktop et mobile

## Technologies

### Frontend
- React 18
- MATERIAL UI
- Chart.js (visualisation des données)
- Fetch (communication API)

### Backend
- Spring Boot 3
- Spring Security
- JPA/Hibernate
- MYSQL
- Authentification JWT

### Infrastructure
- Docker
- Docker Compose
- Nginx (serving frontend en production)

## Prérequis

- Docker 20.10+
- Docker Compose 2.5+
- Node.js 18+ (pour le développement)
- Java 17+ (pour le développement)

## Installation

### Déploiement en production

1. Cloner le dépôt :
   ```bash
   git clone https://github.com/zakariaaitkaddour/HealthTrackPro.git
   cd HealthTrackPro
