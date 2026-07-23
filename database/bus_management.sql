-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: tokaido.proxy.rlwy.net    Database: bus_management
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `bus_id` int NOT NULL,
  `date` date NOT NULL,
  `time_in` time DEFAULT NULL,
  `status` enum('present','absent') DEFAULT 'present',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `bus_id` (`bus_id`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bus_route_assignment`
--

DROP TABLE IF EXISTS `bus_route_assignment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bus_route_assignment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bus_id` int NOT NULL,
  `route_id` int NOT NULL,
  `assigned_on` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bus_id` (`bus_id`),
  KEY `route_id` (`route_id`),
  CONSTRAINT `bus_route_assignment_ibfk_1` FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bus_route_assignment_ibfk_2` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bus_route_assignment`
--

LOCK TABLES `bus_route_assignment` WRITE;
/*!40000 ALTER TABLE `bus_route_assignment` DISABLE KEYS */;
/*!40000 ALTER TABLE `bus_route_assignment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `buses`
--

DROP TABLE IF EXISTS `buses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `buses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bus_number` varchar(20) NOT NULL,
  `route_name` varchar(150) NOT NULL,
  `capacity` int NOT NULL DEFAULT '40',
  `driver_id` int DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bus_number` (`bus_number`),
  KEY `driver_id` (`driver_id`),
  CONSTRAINT `buses_ibfk_1` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `buses`
--

LOCK TABLES `buses` WRITE;
/*!40000 ALTER TABLE `buses` DISABLE KEYS */;
INSERT INTO `buses` VALUES (10,'BUS- 420','Narhe- jantar mantar',60,35,'active','2026-07-21 16:44:23'),(12,'Bus No: 04','Chinchwad Station - Narhe Campus',40,40,'active','2026-07-22 06:20:01'),(13,'Bus No: 01','Pimple Gurav - Narhe Campus',40,37,'active','2026-07-22 17:00:32'),(14,'Bus No: 10','Kothrud Depo - Narhe Campus',30,46,'active','2026-07-22 17:04:35'),(15,'Bus No: 09','Handewadi - Narhe Campus',40,45,'active','2026-07-22 17:05:36'),(16,'Bus No: 08','Pune Station - Narhe Campus',40,44,'active','2026-07-22 17:06:18'),(17,'Bus No: 07','Khadakwasla - Narhe Campus',40,43,'active','2026-07-22 17:06:59'),(18,'Bus No: 06','Kondhwa Gate NDA - Narhe Campus',40,42,'active','2026-07-22 17:07:52'),(19,'Bus No: 05','Ghotawade Phata - Narhe Campus',40,41,'active','2026-07-22 17:08:44'),(20,'Bus No: 03','Vishrantwadi - Narhe Campus',40,39,'active','2026-07-22 17:12:38'),(22,'Bus No: 02','Hadapsar - Narhe Campus',30,38,'active','2026-07-23 05:03:13'),(23,'BUS-786','narhe- jantar mantar',20,76,'active','2026-07-23 05:31:18');
/*!40000 ALTER TABLE `buses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fees`
--

DROP TABLE IF EXISTS `fees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('paid','unpaid') DEFAULT 'unpaid',
  `due_date` date DEFAULT NULL,
  `paid_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `fees_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fees`
--

LOCK TABLES `fees` WRITE;
/*!40000 ALTER TABLE `fees` DISABLE KEYS */;
INSERT INTO `fees` VALUES (1,1,5000.00,'paid','2026-01-15','2026-07-22'),(2,2,5000.00,'paid','2026-07-15','2026-07-18'),(5,11,69000.00,'unpaid','2026-07-22',NULL);
/*!40000 ALTER TABLE `fees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `journey_locations`
--

DROP TABLE IF EXISTS `journey_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `journey_locations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `journey_id` int NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `speed` decimal(5,2) DEFAULT NULL,
  `heading` decimal(6,2) DEFAULT NULL,
  `recorded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `journey_id` (`journey_id`),
  CONSTRAINT `journey_locations_ibfk_1` FOREIGN KEY (`journey_id`) REFERENCES `journeys` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `journey_locations`
--

LOCK TABLES `journey_locations` WRITE;
/*!40000 ALTER TABLE `journey_locations` DISABLE KEYS */;
/*!40000 ALTER TABLE `journey_locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `journeys`
--

DROP TABLE IF EXISTS `journeys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `journeys` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bus_id` int NOT NULL,
  `driver_id` int NOT NULL,
  `route_id` int NOT NULL,
  `journey_date` date NOT NULL,
  `started_at` datetime DEFAULT NULL,
  `ended_at` datetime DEFAULT NULL,
  `status` enum('SCHEDULED','RUNNING','COMPLETED','CANCELLED') DEFAULT 'SCHEDULED',
  PRIMARY KEY (`id`),
  KEY `bus_id` (`bus_id`),
  KEY `driver_id` (`driver_id`),
  KEY `route_id` (`route_id`),
  CONSTRAINT `journeys_ibfk_1` FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`),
  CONSTRAINT `journeys_ibfk_2` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`),
  CONSTRAINT `journeys_ibfk_3` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `journeys`
--

LOCK TABLES `journeys` WRITE;
/*!40000 ALTER TABLE `journeys` DISABLE KEYS */;
/*!40000 ALTER TABLE `journeys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `live_locations`
--

DROP TABLE IF EXISTS `live_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `live_locations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bus_id` int NOT NULL,
  `driver_id` int NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `speed` decimal(5,2) DEFAULT '0.00',
  `heading` decimal(6,2) DEFAULT '0.00',
  `journey_status` enum('NOT_STARTED','RUNNING','PAUSED','COMPLETED') DEFAULT 'NOT_STARTED',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bus_id` (`bus_id`),
  KEY `driver_id` (`driver_id`),
  CONSTRAINT `live_locations_ibfk_1` FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `live_locations_ibfk_2` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `live_locations`
--

LOCK TABLES `live_locations` WRITE;
/*!40000 ALTER TABLE `live_locations` DISABLE KEYS */;
/*!40000 ALTER TABLE `live_locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `audience` enum('all','students','drivers','bus') NOT NULL DEFAULT 'all',
  `bus_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `bus_id` (`bus_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,'Welcome','Welcome to CampusTransit!','all',NULL,'2026-07-21 12:31:46'),(2,'Holiday','College will remain closed tomorrow.','students',NULL,'2026-07-21 12:31:46'),(3,'Drivers Meeting','Meeting at 8 AM tomorrow.','drivers',NULL,'2026-07-21 12:31:46'),(4,'today zeal college is having a renovation ','zeal is not good looking, we will make it iitbombay in 1 year','all',NULL,'2026-07-21 12:37:01');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fee_id` int NOT NULL,
  `student_id` int NOT NULL,
  `razorpay_order_id` varchar(120) DEFAULT NULL,
  `razorpay_payment_id` varchar(120) DEFAULT NULL,
  `razorpay_signature` varchar(255) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `currency` varchar(10) DEFAULT 'INR',
  `payment_method` varchar(30) DEFAULT NULL,
  `status` enum('created','pending','success','failed') DEFAULT 'created',
  `receipt_no` varchar(50) DEFAULT NULL,
  `transaction_date` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `screenshot` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `receipt_no` (`receipt_no`),
  KEY `fee_id` (`fee_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`fee_id`) REFERENCES `fees` (`id`),
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `requests`
--

DROP TABLE IF EXISTS `requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `subject` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `requests_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `requests`
--

LOCK TABLES `requests` WRITE;
/*!40000 ALTER TABLE `requests` DISABLE KEYS */;
INSERT INTO `requests` VALUES (1,1,'Route Timing Change','Can the bus arrive 10 minutes earlier at the City Center stop?','pending','2026-07-18 13:32:37'),(2,2,'Seat Issue','The seat near the window is broken on BUS-02.','approved','2026-07-18 13:32:37');
/*!40000 ALTER TABLE `requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `route_stops`
--

DROP TABLE IF EXISTS `route_stops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `route_stops` (
  `id` int NOT NULL AUTO_INCREMENT,
  `route_id` int NOT NULL,
  `stop_name` varchar(150) NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `stop_order` int NOT NULL,
  `expected_arrival` time DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `route_id` (`route_id`),
  CONSTRAINT `route_stops_ibfk_1` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `route_stops`
--

LOCK TABLES `route_stops` WRITE;
/*!40000 ALTER TABLE `route_stops` DISABLE KEYS */;
INSERT INTO `route_stops` VALUES (1,1,'Katraj',18.45290000,73.85870000,1,'07:00:00'),(2,1,'Navale Bridge',18.46150000,73.84380000,2,'07:10:00'),(3,1,'Narhe',18.46320000,73.82900000,3,'07:20:00'),(4,1,'Zeal College',18.47000000,73.82600000,4,'07:35:00'),(5,2,'Sinhgad Road',18.46620000,73.81730000,1,'07:00:00'),(6,2,'Anand Nagar',18.47350000,73.81880000,2,'07:10:00'),(7,2,'Vadgaon',18.48040000,73.82020000,3,'07:20:00'),(8,2,'Zeal College',18.47000000,73.82600000,4,'07:35:00'),(9,3,'Hadapsar',18.49660000,73.94180000,1,'06:45:00'),(10,3,'Magarpatta',18.51520000,73.93240000,2,'07:00:00'),(11,3,'Kharadi',18.55110000,73.93810000,3,'07:15:00'),(12,3,'Zeal College',18.47000000,73.82600000,4,'07:45:00'),(13,4,'Nigdi',18.65150000,73.76690000,1,'06:50:00'),(14,4,'Akurdi',18.64840000,73.77650000,2,'07:00:00'),(15,4,'Dapodi',18.59060000,73.80670000,3,'07:20:00'),(16,4,'Zeal College',18.47000000,73.82600000,4,'07:45:00'),(17,5,'Swargate',18.50180000,73.86360000,1,'07:10:00'),(18,5,'Sarasbaug',18.49350000,73.85270000,2,'07:18:00'),(19,5,'Parvati',18.48920000,73.85200000,3,'07:25:00'),(20,5,'Zeal College',18.47000000,73.82600000,4,'07:40:00');
/*!40000 ALTER TABLE `route_stops` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `routes`
--

DROP TABLE IF EXISTS `routes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `routes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `route_name` varchar(100) NOT NULL,
  `start_location` varchar(150) NOT NULL,
  `end_location` varchar(150) NOT NULL,
  `total_distance` decimal(6,2) DEFAULT NULL,
  `estimated_time` int DEFAULT NULL COMMENT 'Minutes',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `routes`
--

LOCK TABLES `routes` WRITE;
/*!40000 ALTER TABLE `routes` DISABLE KEYS */;
INSERT INTO `routes` VALUES (1,'Katraj Route','Katraj','Zeal College',18.40,42,1,'2026-07-23 10:41:46','2026-07-23 10:41:46'),(2,'Sinhgad Road Route','Sinhgad Road','Zeal College',22.60,50,1,'2026-07-23 10:41:46','2026-07-23 10:41:46'),(3,'Hadapsar Route','Hadapsar','Zeal College',31.20,65,1,'2026-07-23 10:41:46','2026-07-23 10:41:46'),(4,'Nigdi Route','Nigdi','Zeal College',27.50,55,1,'2026-07-23 10:41:46','2026-07-23 10:41:46'),(5,'Swargate Route','Swargate','Zeal College',16.80,35,1,'2026-07-23 10:41:46','2026-07-23 10:41:46');
/*!40000 ALTER TABLE `routes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `roll_no` varchar(30) NOT NULL,
  `department` varchar(100) DEFAULT NULL,
  `year` varchar(30) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `bus_id` int DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roll_no` (`roll_no`),
  KEY `user_id` (`user_id`),
  KEY `bus_id` (`bus_id`),
  CONSTRAINT `students_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `students_ibfk_2` FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (1,4,'CS2023001','Computer Science','2nd Year','12 MG Road, City Center',22,NULL),(2,5,'EC2023045','Electronics','3rd Year','45 Station Road',20,NULL),(11,21,'UAD6969','AIDS','2 nd Year','Lakshadweep Island, IN',13,NULL),(16,26,'69696969','Minors ','Last year','Gb road ',13,NULL),(19,29,'Ps696959','Majors ','Last year','South ',13,NULL),(20,30,'Mehu6272910','Aids','2nd','Zeal narhe ',13,NULL),(21,31,'Om637289','Aids','2nd','Zeal narhe . ',13,NULL),(23,33,'Soh638289','Aids','2nd','Pune',NULL,NULL),(26,52,'42','AIDS','2nd year','bhumkar chowk',22,NULL),(27,53,'ET8852','ETE','3 year','Railway Station',12,NULL),(28,54,'60','mechanical','3rd','Hadapsar',20,NULL),(29,55,'87','civil','2nd','shivaji nagar',15,NULL),(30,56,'EC11245','ECE','2 year','PCMC',20,NULL),(32,59,'34','computer science','1st','Swargate',12,NULL),(33,61,'76','information technology','2nd','PCMC',16,NULL),(35,63,'AD1854','AI&DS','1 year','Airport Pune',19,NULL),(36,65,'ad1196','aids','2nd','pune',22,NULL),(37,66,'01','ECE','1st','viman nagar',22,NULL),(38,67,'AD1117','AIDS','4th year','Navale bridge',NULL,NULL),(39,68,'CE7658','CSE','1 year','Katraj',NULL,NULL),(40,69,'43','electrical','2nd','hinjewadi',NULL,NULL),(41,70,'AD1126','AI&DS','2 year','PMC\r\n',12,NULL),(42,71,'23','E&TC','4th','sector 04',20,NULL),(43,72,'51','mechanical','2nd','alandi',NULL,NULL),(45,74,'65','IT','1st','Wakad',NULL,NULL),(46,75,'AD1120','AI&DS','2nd year','Katraj ',12,NULL),(47,77,'ad1101','AIDS','2nd','narhe beed\r\n',23,NULL);
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','student','driver') NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `avatar_url` varchar(255) DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expiry` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin User','admin@college.edu','$2a$10$9X3ceXIqPsfcUPC5HpZHfOC/gwx5TpQl0OD5nWVMLvP4dIVxna5Wm','admin','9000000001','2026-07-18 13:32:33',NULL,NULL,NULL),(2,'Ramesh Kumar','driver1@college.edu','$2a$10$YDF0VAJEGVhfpdr28D3KVen2XW30vi8PDYGFb2/WLESAgSeKh1k3i','driver','9000000002','2026-07-18 13:32:33',NULL,NULL,NULL),(3,'Suresh Patil','driver2@college.edu','$2a$10$YDF0VAJEGVhfpdr28D3KVen2XW30vi8PDYGFb2/WLESAgSeKh1k3i','driver','9000000003','2026-07-18 13:32:33',NULL,NULL,NULL),(4,'Om Kapoor','student1@college.edu','$2a$10$KbLxSTRuQCt3ZyuHx9lYc.wI1gX0XxW.QZoQIH4ax23imS7kad5tK','student','9000000004','2026-07-18 13:32:33',NULL,NULL,NULL),(5,'Priya Verma','student2@college.edu','$2a$10$KbLxSTRuQCt3ZyuHx9lYc.wI1gX0XxW.QZoQIH4ax23imS7kad5tK','student','9000000005','2026-07-18 13:32:33',NULL,NULL,NULL),(21,'Om Shahane','dashingshahane@gmail.com','$2a$10$rbtOrYKgZbkCc7YxqdSnfOA1q1n/XmodTE2XYeKB11y3KoU4y.txW','student','696966969609','2026-07-21 15:37:51',NULL,NULL,NULL),(23,'Saujas Salunke ','ss@gmail','$2a$10$LMPlr20Zx4cWcbaemT./W.3rWoU/FDuWivwdPh.2LnqauiDYYejei','student','94646818136','2026-07-21 16:38:09',NULL,NULL,NULL),(26,'Soham bandge','bandge69@gmail','$2a$10$ClUzf3vjIhYOH3qOoqdXbuUWIz9e7LNfcj0qGoKBuqhg4cXY2uI7a','student','94646818136','2026-07-21 16:42:36',NULL,NULL,NULL),(27,'Saujas Salunke ','sausal@hot','$2a$10$cUwK4YXHARTMHEgivtrVg.klrv0akdInBSceZsZ7kKIe.T9wPRtGS','student','94646818136','2026-07-21 16:46:43',NULL,NULL,NULL),(29,'Prathamesh shetty ','shetty@gmail.ca','$2a$10$tzZ6EyITKPls17xBY.IgluSyzrHzwQhZPTbE/JFEbxgQetxtkiojC','student','94646818136','2026-07-21 16:49:28',NULL,NULL,NULL),(30,'Mehul umredkar ','mehu@zeal','$2a$10$m.NOaUUEnKrljQ.CSmtEf.4gCjpHeQA8i8lcG/kVkCL37qDEHOdiu','student','6382910736628','2026-07-21 16:50:24',NULL,NULL,NULL),(31,'Om hedawoo ','om@zeal','$2a$10$acIJf4kvbcYZdEnPVaPBXe4grz/m71ntia/YmEL4oB5URYwRlAD7a','student','63829297','2026-07-21 16:51:11',NULL,NULL,NULL),(33,'Soham randhir ','soham@gmail','$2a$10$jjNB4NWNgtZWq6ifdGG40.VKQ//s04DlV9cCZ1tKOBZZg1GOcjcPW','student','6382910736628','2026-07-21 16:56:23',NULL,NULL,NULL),(35,'Sonam wangchuk','sonam@gmail','$2a$10$SfLvtSDl2jud86P6Jurq7uTVR1Z2kLU8HgXvzOI..uvr09Z9ABUDi','driver','94646818136','2026-07-22 17:02:54',NULL,NULL,NULL),(37,'Bharat Chandanshive','bharat@gmail.com','$2a$10$zfp6nvCKuYCLiscBlPSGl.r.jS3/xkxlPccp/IY2siabHT/vFJm9m','driver','9245189351','2026-07-22 17:16:48',NULL,NULL,NULL),(38,'Rahul Kawade','rahul@gmail.com','$2a$10$REYHVognMYZMOwqbYRx8qOVS9YE8uf.VYzccRK1lQ9790dPDCg1Wq','driver','9175181353','2026-07-22 17:18:17',NULL,NULL,NULL),(39,'Rahul Tapkir','rahul12@gmail.com','$2a$10$Y2JNj9ICUrzwoLBQtymD8uat7qF/D1pjMIBp.XA47orj2ZIVJgVSq','driver','9284369031','2026-07-22 17:19:49',NULL,NULL,NULL),(40,'Raju Gaikwad','raju@gmail.com','$2a$10$wuEtvtCBjdpiOpu5ttFeFO1IM3/QrxaUL4PnbiTskVcdeVIXXVpYq','driver','9241068258','2026-07-22 17:20:55',NULL,NULL,NULL),(41,'Shivakant Borale','shivakant_26@gmail.com','$2a$10$MFYe7KEC3YNPjH/oR75sj.9tP6sZgnDvjaQ2QLDILgKbLljLqB116','driver','8421994973','2026-07-22 17:22:44',NULL,NULL,NULL),(42,'Goutam Bansode','goutam@gmail.com','$2a$10$GyGyTibL5YaFs1NkNPnRYO3JL1RsMWYigOlg4IcTMcuYNivpLaIVy','driver','9822629746','2026-07-22 17:23:48',NULL,NULL,NULL),(43,'Vinayak Sawant','vinayak@gmail.com','$2a$10$YUA4r3qps4/RumWL8D8AMOu8Utx74J9DXBYPkSDHd6ZxeFBQnsitq','driver','9762118725','2026-07-22 17:24:55',NULL,NULL,NULL),(44,'Appa Giram','giram@gmail.com','$2a$10$UGP5kbV4EbjnfqLqs25wuOH7I/NVm9CcZDA3uONj2a8jQMbUxS6Sa','driver','8412809596','2026-07-22 17:26:00',NULL,NULL,NULL),(45,'Amar Rasal','amar@gmail.com','$2a$10$lcuLmDYnxPX6emZF7DMtWOxC6ng7wgv9b16tmf8QAeHmfVph4Ex/u','driver','9011273081','2026-07-22 17:26:47',NULL,NULL,NULL),(46,'Sanjay Sonawane','sanjay@gmail.com','$2a$10$Me6N57yRLwRzqKsECmQzBuUJvMUambl5uWhDZTEYrSoTI..Mhhf1q','driver','8776330495','2026-07-22 17:28:20',NULL,NULL,NULL),(52,'Nihal Roundhal','nihal@gmail.com','$2a$10$O1IExc6slr7BrtTccUZU/OXcSECNxieCxoXrSgU/LIgm9xxNd/W16','student','4567239012','2026-07-23 04:48:15',NULL,NULL,NULL),(53,'Rajesh Kumar','rajeshkumar@gmail','$2a$10$/5ck8e6eGuoTz3DHZBBlBOE24s0D4P4h7cV/HDf5jC/vJ3QSj71kS','student','189034888','2026-07-23 04:49:14',NULL,NULL,NULL),(54,'vishal kalaskar','vishal@gmail.com','$2a$10$n6I3PSoLyAMDJrTXfL8l.eGVglG6h01yC3Q6/w5cWZoouijkXalCi','student','25*********','2026-07-23 04:49:20',NULL,NULL,NULL),(55,'pranav patil','pranavpatil@gmail.com','$2a$10$DHF81hvi/HYp1iuBozhCiubrU4FQSDwRybfTz31OvMm/OIzZfz3Uq','student','345*********','2026-07-23 04:51:05',NULL,NULL,NULL),(56,'Vishal Mishra ','vishalm@gmail.com','$2a$10$ltF6d73qby.rpPTYgfzjVO8nWTbd8d7y0mB4RxyfCshrILRxT51EW','student','985168521','2026-07-23 04:51:33',NULL,NULL,NULL),(59,'Prajakta Dhotre ','Prajakta@gmail.com','$2a$10$NmbS30hw2gFeONDhykxf2.lGrzXs0ShXVlHLeM9LBGZVrPkR6wYBW','student','8765******','2026-07-23 04:57:37',NULL,NULL,NULL),(61,'sujal ramteke','sujal@gmail.com','$2a$10$5Sf0KUAdIqNVtOrnh0RdrO75Z5HkALe3X.NgN6hAJSeJM8F0mTD3a','student','245*******','2026-07-23 05:05:58',NULL,NULL,NULL),(62,'Parth Mhavale','parth@gmail.com','$2a$10$KM2ML999US7OotRHhkGIE..VACdYJ0zvVKgWWjgqzXVWBjFTdaaXW','student','6872458689','2026-07-23 05:06:54',NULL,NULL,NULL),(63,'Rahul Kale','rahulK@gmail.com','$2a$10$of/L7fx99al3/NF6IdsV6e.z66nJo1sOdgJWsKbXXAXNtnnbih3fS','student','7485485','2026-07-23 05:07:47',NULL,NULL,NULL),(65,'Rajesh bandge (patil)','rajesh@mail','$2a$10$qomcOj/pI9I253muJkAPUuRgqkdolImNOxEQ0ctxE1y43FAkCKV8G','student','78654126','2026-07-23 05:11:29',NULL,NULL,NULL),(66,'gaurav polshetwar','gaurav@gmail.com','$2a$10$5yRSEE7Q1DMBdA8mFszv1O5NREb.Xh60m0CuzO.gA9Ik8WJUDRPB6','student','5321******','2026-07-23 05:11:30',NULL,NULL,NULL),(67,'santosh kambale','santosh@gmail.com','$2a$10$SqPKh4qSE8jAdL5R9gz5GuESIIiJj7a.0B/L1OcZXssOTr695bK9i','student','3574458743','2026-07-23 05:12:33',NULL,NULL,NULL),(68,'Raju Dhoble','rajudho@gmail.com','$2a$10$5wDR/I0I4ZmUYJqwGac3HOAovW6c9.abOq6ZmpC/VyuSLdRVfR6f2','student','4859859','2026-07-23 05:12:35',NULL,NULL,NULL),(69,'shivraj patil','shivraj@gmail.com','$2a$10$JFmOkCBq9WCeWRP3ltPAs.X4T3RTxbHhUhml6sKrKTfbtQDTo9Ciq','student','4422******','2026-07-23 05:13:18',NULL,NULL,NULL),(70,'Gauri Deshmukh','gauri@gmail.com','$2a$10$PV5CIsNErHKfjUf1O1Ww9eKtQ/.qhz0qN5QT.l94LNebvGXx6ZEla','student','45462521','2026-07-23 05:15:17',NULL,NULL,NULL),(71,'ritesh peddapure','ritesh@gmail.com','$2a$10$Y6GPuqbfFuXbg2ev8X74KOubZqcsTOR6jerYYW47Q8wX7sWlXe1YW','student','6521******','2026-07-23 05:17:30',NULL,NULL,NULL),(72,'vijay shinde','vijay@gmail.com','$2a$10$.gwjdAnidgD73L.8/U8UpOo0x100I.KkU7.lm.EzH8C6n5TfpHdCG','student','8762******','2026-07-23 05:19:33',NULL,NULL,NULL),(74,'yogesh wakde','yogesh@gmail.com','$2a$10$cV2j.z9crCyORWIFrBn/oeGA7G3ZnBvW859DvhnvYCb0ddXYCDVKq','student','9087******','2026-07-23 05:23:05',NULL,NULL,NULL),(75,'Mayur  Likhar ','mayur@gmail.com','$2a$10$.1cxkw.3LXzfCz.YcVHiz.ItYkNSUEdVgbfdDxAtfIbxaWSIboVh6','student','552545','2026-07-23 05:23:42',NULL,NULL,NULL),(76,'Salman khan','salman@gmail.com','$2a$10$7.l2iOmFC1MFhmIQQ2AQ6OE2FADi2fkySiWTfb29PpPF9EUTVXTyW','driver','7558666663','2026-07-23 05:29:25',NULL,NULL,NULL),(77,'Anuj Suryavanshi ','anuj@hotmail','$2a$10$z7Dw5U03SFIgN/sXfuvKsO3394i.BqshBaYuTi2s644ZZu/yQUnL6','student','794653287','2026-07-23 05:32:35',NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-23 16:18:23
