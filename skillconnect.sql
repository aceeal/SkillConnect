-- MySQL dump 10.13  Distrib 8.0.34, for Win64 (x86_64)
--
-- Host: localhost    Database: skillconnect
-- ------------------------------------------------------
-- Server version	8.0.34

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
-- Table structure for table `contact_submissions`
--

DROP TABLE IF EXISTS `contact_submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_submissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `is_bug_report` tinyint(1) DEFAULT '0',
  `status` enum('new','in_progress','resolved') DEFAULT 'new',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_contact_submissions_status` (`status`),
  KEY `idx_contact_submissions_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_submissions`
--

LOCK TABLES `contact_submissions` WRITE;
/*!40000 ALTER TABLE `contact_submissions` DISABLE KEYS */;
INSERT INTO `contact_submissions` VALUES (1,'12','12@gmail.com','123321',1,'new','2025-04-23 03:41:47');
/*!40000 ALTER TABLE `contact_submissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `live_sessions`
--

DROP TABLE IF EXISTS `live_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `live_sessions` (
  `id` varchar(255) NOT NULL,
  `user1_id` varchar(255) NOT NULL,
  `user2_id` varchar(255) NOT NULL,
  `user1_name` varchar(255) DEFAULT NULL,
  `user2_name` varchar(255) DEFAULT NULL,
  `started_at` datetime NOT NULL,
  `ended_at` datetime DEFAULT NULL,
  `duration_minutes` int DEFAULT NULL,
  `status` enum('ongoing','completed','disconnected','terminated') NOT NULL,
  `topic` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_live_sessions_user1` (`user1_id`),
  KEY `idx_live_sessions_user2` (`user2_id`),
  KEY `idx_live_sessions_started_at` (`started_at`),
  KEY `idx_live_sessions_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `live_sessions`
--

LOCK TABLES `live_sessions` WRITE;
/*!40000 ALTER TABLE `live_sessions` DISABLE KEYS */;
INSERT INTO `live_sessions` VALUES ('room_1746716326946_agw1ypk','6','5','andrei morri','ace albao','2025-05-08 22:58:47',NULL,NULL,'ongoing','Direct Call','2025-05-08 14:58:47'),('room_1746716354028_jexmla6','5','6','ace albao','andrei morri','2025-05-08 22:59:14',NULL,NULL,'ongoing','Direct Call','2025-05-08 14:59:14'),('room_1746716886420_eiseowh','5','6','ace albao','andrei morri','2025-05-08 23:08:06','2025-05-08 23:08:14',0,'completed','Direct Call','2025-05-08 15:08:06'),('room_1746716936999_kvtj5yt','5','6','ace albao','andrei morri','2025-05-08 23:08:57','2025-05-08 23:09:05',0,'completed','Direct Call','2025-05-08 15:08:57'),('room_1746722225985_ifhedl2','2','5','Kim Casapao','ace albao','2025-05-09 00:37:06','2025-05-09 00:40:10',3,'completed','Direct Call','2025-05-08 16:37:06'),('room_1747315822127_a1654tq','2','5','Kim Casapao','ace albao','2025-05-15 21:30:22',NULL,NULL,'ongoing','Direct Call','2025-05-15 13:30:22'),('session-1746717310068-749','AQ4_cAyh8bXisRjLAAB3','_bc936HRP_7IfSziAAB1','andrei morri','ace albao','2025-05-08 23:15:10','2025-05-08 23:18:07',2,'completed','Biology & Life Sciences','2025-05-08 15:15:10'),('session-1747104145144-767','KH0ZEgZxYFiUlLnkAAAP','XsbPmxAd_aM9KpKMAAAN','ace albao','andrei morri','2025-05-13 10:42:25','2025-05-13 10:43:45',1,'completed','General Learning','2025-05-13 02:42:25'),('session-1747104496427-161','YUP8xIzUiYlXlKqdAAAo','NIgjcw31fHtGnTYqAAAk','andrei morri','ace albao','2025-05-13 10:48:16','2025-05-13 10:48:18',0,'disconnected','Cybersecurity Basics','2025-05-13 02:48:16'),('session-1747107243229-400','J4wiPl6l1v75waqlAACS','k_s0_1APda9qQFECAACQ','Erick Monserrat','Kim Casapao','2025-05-13 11:34:03','2025-05-13 11:34:15',0,'completed','Mathematics (Algebra, Calculus, Trigonometry)','2025-05-13 03:34:03'),('session-1747200242089-170','MUm5lLkiFg7Go0lxAAAj','-7RHtRS3BFULXQeSAAAf','Kim Casapao','andrei morri','2025-05-14 13:24:02','2025-05-14 13:24:28',0,'completed','Biology & Life Sciences','2025-05-14 05:24:02'),('session-1747200429176-619','z7vL0xTVmTj_k1H-AABL','_1OZXm21DSo-AG17AABJ','ace albao','andrei morri','2025-05-14 13:27:09','2025-05-14 13:27:45',0,'completed','Biology & Life Sciences','2025-05-14 05:27:09'),('session-1747201496187-558','W60U2Jy4AFh9Pgr5AACc','HlAEMKiiWFt3UbrTAACe','Jack Daniel  Pineda','Crimson User','2025-05-14 13:44:56','2025-05-14 13:46:36',1,'completed','Mathematics (Algebra, Calculus, Trigonometry)','2025-05-14 05:44:56'),('session-1747201582713-368','IQNT6NyXFl1xClEcAACz','MYnPFungKzqgyx2zAACx','Zeus Kenneth Lizarondo','Jhon Chester Dela Cueva','2025-05-14 13:46:23','2025-05-14 13:48:35',2,'completed','Graphic Design (Canva, Photoshop)','2025-05-14 05:46:22'),('session-1747201609202-504','Slxa3COc6440ED7pAACv','6Owkizl4GuLFiAVhAACt','Kyle Esteves','Matt Lim','2025-05-14 13:46:49','2025-05-14 13:46:58',0,'disconnected','Biology & Life Sciences','2025-05-14 05:46:49');
/*!40000 ALTER TABLE `live_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sender_id` int NOT NULL,
  `receiver_id` int NOT NULL,
  `text` text NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `receiver_id` (`receiver_id`),
  KEY `idx_messages_sender_receiver` (`sender_id`,`receiver_id`),
  KEY `idx_messages_created_at` (`created_at`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=121 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES (1,2,5,'ace',1,'2025-05-04 14:05:32'),(2,2,6,'morri',1,'2025-05-04 14:06:03'),(3,2,5,'sda',1,'2025-05-04 14:14:31'),(4,2,5,'ds',1,'2025-05-04 14:14:33'),(5,2,5,'ace',1,'2025-05-04 14:14:36'),(6,2,5,'ace',1,'2025-05-04 14:16:44'),(7,2,6,'morieeeeeeee',1,'2025-05-04 14:18:33'),(8,2,6,'dsa',1,'2025-05-04 14:19:45'),(9,2,6,'sad',1,'2025-05-04 14:27:27'),(10,2,6,'asd',1,'2025-05-04 14:36:25'),(11,2,6,'dsa',1,'2025-05-04 14:36:33'),(12,2,5,'dsa',1,'2025-05-04 16:58:50'),(13,2,5,'dsa',1,'2025-05-04 16:58:50'),(14,2,5,'ds',1,'2025-05-04 16:58:51'),(15,2,6,'hello',1,'2025-05-04 17:14:40'),(16,6,2,'wassup',1,'2025-05-04 17:14:54'),(17,6,2,'asd',1,'2025-05-04 17:15:21'),(18,2,6,'sd',1,'2025-05-04 18:40:32'),(19,2,6,'morri',1,'2025-05-04 18:45:39'),(20,2,6,'asd',1,'2025-05-04 18:46:01'),(21,6,2,'sad',1,'2025-05-04 18:46:25'),(22,2,6,'asd',1,'2025-05-04 18:46:27'),(23,2,6,'1',1,'2025-05-04 18:46:38'),(24,6,2,'asd',1,'2025-05-04 18:50:16'),(25,2,6,'d',1,'2025-05-04 18:54:30'),(26,2,6,'s',1,'2025-05-04 18:58:36'),(27,2,6,'sad',1,'2025-05-04 19:03:56'),(28,2,6,'as',1,'2025-05-04 19:03:58'),(29,6,2,'s',1,'2025-05-04 19:05:25'),(30,2,6,'a',1,'2025-05-04 19:25:39'),(31,2,6,'sad',1,'2025-05-04 19:25:47'),(32,6,2,'a',1,'2025-05-04 19:25:59'),(33,2,6,'1',1,'2025-05-04 19:27:39'),(34,2,6,'2',1,'2025-05-04 19:27:43'),(35,2,6,'2',1,'2025-05-04 19:32:18'),(36,6,2,'1',1,'2025-05-04 19:32:29'),(37,2,6,'test',1,'2025-05-04 19:34:43'),(38,2,6,'1',1,'2025-05-04 19:34:53'),(39,2,6,'3',1,'2025-05-04 19:38:23'),(40,2,6,'1',1,'2025-05-04 19:38:24'),(41,2,6,'2',1,'2025-05-04 19:38:26'),(42,2,6,'2',1,'2025-05-04 19:40:44'),(43,2,6,'3',1,'2025-05-04 19:40:47'),(44,6,2,'asd',1,'2025-05-04 19:42:17'),(45,6,2,'qwe',1,'2025-05-04 19:48:14'),(46,5,2,'1',1,'2025-05-07 11:45:34'),(47,5,6,'test',1,'2025-05-07 11:46:54'),(48,5,6,'test 2',1,'2025-05-07 11:47:12'),(49,6,5,'test',1,'2025-05-07 11:47:20'),(50,5,6,'1',1,'2025-05-07 11:50:35'),(51,6,5,'2',1,'2025-05-07 11:50:48'),(52,5,6,'3',1,'2025-05-07 12:05:30'),(53,6,5,'1',1,'2025-05-07 12:05:46'),(54,6,5,'adsadsadsa',1,'2025-05-07 12:06:45'),(55,6,5,'asd',1,'2025-05-07 12:08:01'),(56,5,6,'a',1,'2025-05-07 12:13:59'),(57,5,6,'1',1,'2025-05-07 12:14:30'),(58,6,5,'1',1,'2025-05-07 12:14:33'),(59,6,5,'2123',1,'2025-05-07 12:14:44'),(60,5,6,'123',1,'2025-05-07 12:14:45'),(61,5,6,'1',1,'2025-05-07 12:15:57'),(62,5,6,'1',1,'2025-05-07 12:20:32'),(63,5,6,'hello',1,'2025-05-07 12:20:53'),(64,5,6,'1',1,'2025-05-07 12:21:48'),(65,6,5,'1',1,'2025-05-07 12:21:58'),(66,5,6,'1',1,'2025-05-07 12:34:17'),(67,5,6,'123',1,'2025-05-07 12:34:34'),(68,5,6,'1',1,'2025-05-07 12:35:15'),(69,6,5,'2',1,'2025-05-07 12:35:20'),(70,6,5,'2',1,'2025-05-07 12:35:21'),(71,6,5,'2',1,'2025-05-07 12:35:22'),(72,5,6,'1',1,'2025-05-07 12:35:54'),(73,6,5,'2',1,'2025-05-07 12:35:56'),(74,5,6,'1',1,'2025-05-07 12:35:57'),(75,6,5,'2',1,'2025-05-07 12:35:59'),(76,5,6,'33',1,'2025-05-07 12:36:01'),(77,5,8,'hello',1,'2025-05-07 12:40:50'),(78,8,5,'hi',1,'2025-05-07 12:41:09'),(79,5,8,'hahaha',0,'2025-05-07 12:41:14'),(80,8,5,'ahaha',1,'2025-05-07 12:41:15'),(81,5,6,'1',1,'2025-05-07 12:53:36'),(82,5,2,'1',1,'2025-05-07 15:23:33'),(83,5,2,'2',1,'2025-05-07 15:23:34'),(84,6,5,'2',1,'2025-05-07 15:26:34'),(85,5,6,'1',1,'2025-05-07 15:26:34'),(86,5,6,'1',1,'2025-05-07 15:26:42'),(87,5,6,'ace',1,'2025-05-07 15:26:45'),(88,6,5,'ace',1,'2025-05-07 15:26:47'),(89,6,5,'12312321312',1,'2025-05-07 15:26:50'),(90,5,6,'1231',1,'2025-05-07 15:26:51'),(91,5,6,'Hello, I would like to connect with you!',1,'2025-05-07 15:29:45'),(92,5,6,'Hello, I would like to connect with you!',1,'2025-05-07 15:29:45'),(93,5,6,'Hello, I would like to connect with you!',1,'2025-05-07 15:29:47'),(94,5,6,'Hello, I would like to connect with you!',1,'2025-05-07 15:29:52'),(95,5,6,'Hello, I would like to connect with you!',1,'2025-05-07 15:33:26'),(96,5,6,'Hello, I would like to connect with you!',1,'2025-05-07 15:33:26'),(97,5,7,'123',0,'2025-05-07 15:39:27'),(98,5,7,'312',0,'2025-05-07 15:39:42'),(99,5,6,'1233',1,'2025-05-07 15:46:52'),(100,5,6,'321',1,'2025-05-07 15:46:52'),(101,5,6,'test',1,'2025-05-07 16:03:17'),(102,6,5,'123',1,'2025-05-07 16:03:36'),(103,5,6,'321',1,'2025-05-07 16:03:37'),(104,6,5,'321',1,'2025-05-07 16:03:41'),(105,5,6,'1',1,'2025-05-07 16:03:44'),(106,5,6,'2',1,'2025-05-07 16:03:45'),(107,5,6,'3',1,'2025-05-07 16:03:45'),(108,6,5,'1',1,'2025-05-07 16:03:47'),(109,6,5,'2',1,'2025-05-07 16:03:47'),(110,6,5,'3',1,'2025-05-07 16:03:48'),(111,5,6,'123',1,'2025-05-08 15:04:22'),(112,2,5,'Hello',1,'2025-05-08 16:31:37'),(113,2,6,'Test',1,'2025-05-08 16:31:39'),(114,52,55,'wasup',1,'2025-05-14 05:41:20'),(115,55,53,'yo im gay',0,'2025-05-14 05:43:08'),(116,55,54,'kulot',0,'2025-05-14 05:43:38'),(117,53,55,'asfafaf',0,'2025-05-14 05:44:19'),(118,53,54,'hatdog',0,'2025-05-14 05:44:38'),(119,54,53,'psadd',0,'2025-05-14 05:44:56'),(120,55,52,'why are you gay',0,'2025-05-14 05:48:31');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reported_user_id` int NOT NULL,
  `reported_by_user_id` int NOT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','reviewed','resolved') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `reported_user_id` (`reported_user_id`),
  KEY `reported_by_user_id` (`reported_by_user_id`),
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`reported_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`reported_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `skill_categories`
--

DROP TABLE IF EXISTS `skill_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `skill_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `skill_categories`
--

LOCK TABLES `skill_categories` WRITE;
/*!40000 ALTER TABLE `skill_categories` DISABLE KEYS */;
INSERT INTO `skill_categories` VALUES (1,'IT and Computer Science'),(2,'Academic Subjects'),(3,'Technical & Creative Skills'),(4,'Practical Skills');
/*!40000 ALTER TABLE `skill_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `skill_list`
--

DROP TABLE IF EXISTS `skill_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `skill_list` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `category_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `skill_list_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `skill_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `skill_list`
--

LOCK TABLES `skill_list` WRITE;
/*!40000 ALTER TABLE `skill_list` DISABLE KEYS */;
INSERT INTO `skill_list` VALUES (1,'Python Programming',1),(2,'Java Programming',1),(3,'C++ Programming',1),(4,'JavaScript & Web Development',1),(5,'PHP & MySQL',1),(6,'Mobile App Development',1),(7,'Cybersecurity Basics',1),(8,'Data Science & Analytics',1),(9,'Mathematics (Algebra, Calculus, Trigonometry)',2),(10,'Physics Fundamentals',2),(11,'Chemistry Basics',2),(12,'Biology & Life Sciences',2),(13,'Economics & Business Studies',2),(14,'Financial Literacy & Budgeting',2),(15,'Entrepreneurship Basics',2),(16,'Graphic Design (Canva, Photoshop)',3),(17,'Video Editing (Premiere Pro, CapCut)',3),(18,'Creative Writing & Essay Writing',3),(19,'Public Speaking & Communication',3),(20,'Guitar Basics',4),(21,'Photography & Videography',4),(22,'Critical Thinking & Problem Solving',4);
/*!40000 ALTER TABLE `skill_list` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `skills`
--

DROP TABLE IF EXISTS `skills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `skills` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `skill` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `skills_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=91 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `skills`
--

LOCK TABLES `skills` WRITE;
/*!40000 ALTER TABLE `skills` DISABLE KEYS */;
INSERT INTO `skills` VALUES (32,6,'C++ Programming','2025-04-24 00:08:01'),(43,2,'Graphic Design (Canva, Photoshop)','2025-04-25 07:18:31'),(44,2,'Critical Thinking & Problem Solving','2025-04-25 07:18:31'),(45,2,'Mathematics (Algebra, Calculus, Trigonometry)','2025-04-25 07:18:31'),(54,4,'Admin','2025-04-25 15:25:07'),(56,15,'Biology & Life Sciences','2025-05-05 03:43:32'),(58,17,'Entrepreneurship Basics','2025-05-05 03:45:56'),(59,23,'Mobile App Development','2025-05-05 03:47:48'),(60,23,'Data Science & Analytics','2025-05-05 03:47:48'),(61,24,'Mobile App Development','2025-05-05 03:47:55'),(62,24,'Data Science & Analytics','2025-05-05 03:47:55'),(63,35,'Mathematics (Algebra, Calculus, Trigonometry)','2025-05-05 06:10:43'),(64,5,'C++ Programming','2025-05-08 16:36:56'),(65,5,'Cybersecurity Basics','2025-05-08 16:36:56'),(75,53,'Java Programming','2025-05-14 05:43:58'),(76,53,'Mobile App Development','2025-05-14 05:43:58'),(77,53,'Python Programming','2025-05-14 05:43:58'),(78,53,'PHP & MySQL','2025-05-14 05:43:58'),(79,53,'Sleeping','2025-05-14 05:43:58'),(80,54,'Graphic Design (Canva, Photoshop)','2025-05-14 05:44:11'),(81,54,'Video Editing (Premiere Pro, CapCut)','2025-05-14 05:44:11'),(82,55,'C++ Programming','2025-05-14 05:46:38'),(83,55,'Cybersecurity Basics','2025-05-14 05:46:38'),(84,55,'Mobile App Development','2025-05-14 05:46:38'),(85,55,'Python Programming','2025-05-14 05:46:38'),(86,55,'PHP & MySQL','2025-05-14 05:46:38'),(87,55,'JavaScript & Web Development','2025-05-14 05:46:38'),(88,55,'Data Science & Analytics','2025-05-14 05:46:38'),(89,55,'Java Programming','2025-05-14 05:46:38'),(90,55,'Dancer','2025-05-14 05:46:38');
/*!40000 ALTER TABLE `skills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `social_media`
--

DROP TABLE IF EXISTS `social_media`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `social_media` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `platform` varchar(50) NOT NULL,
  `url` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `social_media_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `social_media`
--

LOCK TABLES `social_media` WRITE;
/*!40000 ALTER TABLE `social_media` DISABLE KEYS */;
INSERT INTO `social_media` VALUES (1,5,'facebook','https://facebook.com/ace2','2025-04-25 07:01:05','2025-04-25 07:07:11'),(2,5,'twitter','https://twitter.com/ace2','2025-04-25 07:01:05','2025-04-25 07:07:13'),(3,55,'facebook','https://facebook.com/hehehe999999','2025-05-14 05:47:35','2025-05-14 05:47:35'),(4,55,'twitter','https://twitter.com/','2025-05-14 05:47:35','2025-05-14 05:47:35');
/*!40000 ALTER TABLE `social_media` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_activities`
--

DROP TABLE IF EXISTS `user_activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_activities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `activity_type` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_activities_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=158 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_activities`
--

LOCK TABLES `user_activities` WRITE;
/*!40000 ALTER TABLE `user_activities` DISABLE KEYS */;
INSERT INTO `user_activities` VALUES (1,2,'profile_update','Updated profile information','2025-03-29 01:35:13'),(2,2,'profile_update','Updated profile information','2025-03-29 01:35:44'),(3,2,'profile_update','Updated profile information','2025-03-29 01:35:53'),(4,2,'profile_update','Updated profile information','2025-03-29 01:35:59'),(5,2,'profile_update','Updated profile information','2025-03-29 01:36:03'),(6,2,'profile_update','Updated profile information','2025-03-29 01:36:27'),(7,2,'profile_update','Updated profile information','2025-03-29 01:36:31'),(8,2,'profile_update','Updated profile information','2025-03-29 01:36:34'),(9,2,'profile_update','Updated profile information','2025-03-29 01:36:51'),(10,2,'profile_update','Updated profile information','2025-03-29 01:37:04'),(11,2,'profile_update','Updated profile information','2025-03-29 01:37:07'),(12,2,'profile_update','Updated profile information','2025-03-29 01:37:11'),(13,2,'profile_update','Updated profile information','2025-03-29 01:37:24'),(14,2,'profile_update','Updated profile information','2025-03-29 01:37:27'),(15,2,'profile_update','Updated profile information','2025-03-29 01:37:38'),(16,2,'profile_update','Updated profile information','2025-03-29 01:37:48'),(17,2,'profile_update','Updated profile information','2025-03-29 01:37:58'),(18,2,'profile_update','Updated profile information','2025-03-29 01:42:37'),(19,2,'security_update','Changed account password','2025-03-29 01:43:02'),(20,2,'security_update','Changed account password','2025-03-29 01:43:19'),(21,2,'profile_update','Updated profile information','2025-04-02 06:35:49'),(22,2,'profile_update','Updated profile information','2025-04-02 06:36:08'),(23,5,'security_update','Changed account password','2025-04-21 05:42:32'),(24,5,'profile_update','Updated profile information','2025-04-21 05:45:12'),(25,5,'profile_update','Updated profile information','2025-04-21 05:45:15'),(26,5,'profile_update','Updated profile information','2025-04-21 05:45:17'),(27,5,'profile_update','Updated profile information','2025-04-21 05:45:23'),(28,5,'profile_update','Updated profile information','2025-04-21 05:50:10'),(29,5,'profile_update','Updated profile information','2025-04-21 06:06:32'),(30,5,'profile_update','Updated profile information','2025-04-21 06:06:36'),(31,5,'profile_update','Updated profile information','2025-04-21 09:32:57'),(32,5,'profile_update','Updated profile information','2025-04-21 09:38:20'),(33,5,'profile_update','Updated profile information','2025-04-21 09:51:33'),(34,6,'profile_update','Updated profile information','2025-04-21 09:52:04'),(35,5,'profile_update','Updated profile information','2025-04-21 09:59:01'),(36,5,'profile_update','Updated profile information','2025-04-21 09:59:06'),(37,6,'profile_update','Updated profile information','2025-04-21 10:26:51'),(38,6,'profile_update','Updated profile information','2025-04-21 10:34:55'),(39,5,'profile_update','Updated profile information','2025-04-22 03:15:04'),(40,5,'profile_update','Updated skills','2025-04-23 23:30:21'),(41,5,'profile_update','Updated skills','2025-04-23 23:30:32'),(42,5,'profile_update','Updated profile information','2025-04-23 23:30:42'),(43,5,'profile_update','Updated profile information','2025-04-23 23:30:45'),(44,5,'profile_update','Updated profile information','2025-04-23 23:30:50'),(45,5,'profile_update','Updated skills','2025-04-23 23:30:58'),(46,5,'profile_update','Updated skills','2025-04-23 23:31:10'),(47,5,'profile_update','Updated skills','2025-04-23 23:31:16'),(48,5,'profile_update','Updated skills','2025-04-23 23:31:31'),(49,5,'profile_update','Updated skills','2025-04-23 23:31:37'),(50,5,'profile_update','Updated skills','2025-04-23 23:31:46'),(51,5,'profile_update','Updated skills','2025-04-23 23:32:01'),(52,5,'profile_update','Updated skills','2025-04-23 23:32:45'),(53,5,'profile_update','Updated skills','2025-04-23 23:36:05'),(54,5,'profile_update','Updated interests','2025-04-23 23:36:06'),(55,5,'profile_update','Updated skills','2025-04-23 23:36:31'),(56,5,'profile_update','Updated interests','2025-04-23 23:36:31'),(57,5,'profile_update','Updated skills','2025-04-23 23:37:06'),(58,5,'profile_update','Updated interests','2025-04-23 23:37:06'),(59,5,'profile_update','Updated profile information','2025-04-23 23:46:06'),(60,5,'profile_update','Updated skills','2025-04-24 00:07:32'),(61,5,'profile_update','Updated interests','2025-04-24 00:07:32'),(62,6,'profile_update','Updated skills','2025-04-24 00:08:01'),(63,6,'profile_update','Updated interests','2025-04-24 00:08:01'),(64,5,'profile_update','Updated profile information','2025-04-24 12:09:57'),(65,5,'profile_update','Updated profile information','2025-04-24 12:12:21'),(66,5,'profile_update','Updated profile information','2025-04-24 12:25:11'),(67,5,'profile_update','Updated profile information','2025-04-25 07:01:05'),(68,5,'profile_update','Updated profile information','2025-04-25 07:01:09'),(69,5,'profile_update','Updated profile information','2025-04-25 07:06:45'),(70,5,'profile_update','Updated profile information','2025-04-25 07:06:47'),(71,5,'profile_update','Updated profile information','2025-04-25 07:06:50'),(72,5,'profile_update','Updated profile information','2025-04-25 07:06:52'),(73,5,'profile_update','Updated profile information','2025-04-25 07:06:56'),(74,5,'profile_update','Updated profile information','2025-04-25 07:07:00'),(75,5,'profile_update','Updated profile information','2025-04-25 07:07:03'),(76,5,'profile_update','Updated profile information','2025-04-25 07:07:06'),(77,5,'profile_update','Updated profile information','2025-04-25 07:07:09'),(78,5,'profile_update','Updated profile information','2025-04-25 07:07:11'),(79,5,'profile_update','Updated profile information','2025-04-25 07:07:13'),(80,5,'profile_update','Updated profile information','2025-04-25 07:08:07'),(81,5,'profile_update','Updated profile information','2025-04-25 07:08:47'),(82,5,'profile_update','Updated profile information','2025-04-25 07:13:24'),(83,5,'profile_update','Updated profile information','2025-04-25 07:13:30'),(84,5,'profile_update','Updated skills','2025-04-25 07:13:36'),(85,5,'profile_update','Updated interests','2025-04-25 07:13:36'),(86,2,'profile_update','Updated profile information','2025-04-25 07:17:31'),(87,2,'profile_update','Updated skills','2025-04-25 07:18:01'),(88,2,'profile_update','Updated interests','2025-04-25 07:18:01'),(89,2,'profile_update','Updated skills','2025-04-25 07:18:19'),(90,2,'profile_update','Updated interests','2025-04-25 07:18:19'),(91,2,'profile_update','Updated skills','2025-04-25 07:18:31'),(92,2,'profile_update','Updated interests','2025-04-25 07:18:31'),(93,2,'profile_update','Updated profile information','2025-04-25 07:18:48'),(94,2,'profile_update','Updated profile information','2025-04-25 07:19:04'),(95,4,'profile_update','Updated profile information','2025-04-25 15:19:21'),(96,4,'profile_update','Updated skills','2025-04-25 15:19:35'),(97,4,'profile_update','Updated interests','2025-04-25 15:19:35'),(98,4,'profile_update','Updated profile information','2025-04-25 15:19:47'),(99,4,'profile_update','Updated profile information','2025-04-25 15:19:56'),(100,4,'profile_update','Updated skills','2025-04-25 15:25:07'),(101,4,'profile_update','Updated interests','2025-04-25 15:25:07'),(102,5,'profile_update','Updated profile information','2025-04-29 03:06:19'),(103,7,'profile_update','Updated profile information','2025-05-02 06:33:17'),(104,7,'profile_update','Updated profile information','2025-05-02 06:33:24'),(105,7,'profile_update','Updated profile information','2025-05-02 06:34:07'),(106,8,'profile_update','Updated profile information','2025-05-02 06:50:50'),(107,12,'profile_update','Updated profile information','2025-05-02 06:58:32'),(108,14,'profile_update','Updated profile information','2025-05-02 07:08:08'),(109,15,'profile_update','Updated skills','2025-05-05 03:43:14'),(110,15,'profile_update','Updated interests','2025-05-05 03:43:14'),(111,15,'profile_update','Updated skills','2025-05-05 03:43:32'),(112,15,'profile_update','Updated interests','2025-05-05 03:43:32'),(113,20,'profile_update','Updated profile information','2025-05-05 03:44:59'),(114,20,'profile_update','Updated profile information','2025-05-05 03:44:59'),(115,17,'profile_update','Updated skills','2025-05-05 03:45:35'),(116,17,'profile_update','Updated interests','2025-05-05 03:45:35'),(117,17,'profile_update','Updated skills','2025-05-05 03:45:56'),(118,17,'profile_update','Updated interests','2025-05-05 03:45:56'),(119,23,'profile_update','Updated skills','2025-05-05 03:47:48'),(120,23,'profile_update','Updated interests','2025-05-05 03:47:48'),(121,24,'profile_update','Updated skills','2025-05-05 03:47:55'),(122,24,'profile_update','Updated interests','2025-05-05 03:47:55'),(123,35,'profile_update','Updated profile information','2025-05-05 06:10:03'),(124,35,'profile_update','Updated skills','2025-05-05 06:10:43'),(125,35,'profile_update','Updated interests','2025-05-05 06:10:43'),(126,36,'profile_update','Updated profile information','2025-05-05 06:12:14'),(127,33,'profile_update','Updated profile information','2025-05-05 06:12:42'),(128,40,'profile_update','Updated profile information','2025-05-05 06:52:25'),(129,40,'profile_update','Updated skills','2025-05-05 06:53:32'),(130,40,'profile_update','Updated interests','2025-05-05 06:53:32'),(131,5,'profile_update','Updated profile information','2025-05-06 03:46:23'),(132,5,'profile_update','Updated skills','2025-05-08 16:36:56'),(133,5,'profile_update','Updated interests','2025-05-08 16:36:56'),(134,53,'profile_update','Updated profile information','2025-05-14 05:42:31'),(135,53,'profile_update','Updated profile information','2025-05-14 05:42:39'),(136,53,'profile_update','Updated profile information','2025-05-14 05:42:39'),(137,53,'profile_update','Updated profile information','2025-05-14 05:42:55'),(138,54,'profile_update','Updated skills','2025-05-14 05:42:59'),(139,54,'profile_update','Updated interests','2025-05-14 05:42:59'),(140,54,'profile_update','Updated skills','2025-05-14 05:43:14'),(141,54,'profile_update','Updated interests','2025-05-14 05:43:14'),(142,56,'profile_update','Updated skills','2025-05-14 05:43:24'),(143,56,'profile_update','Updated interests','2025-05-14 05:43:24'),(144,56,'profile_update','Updated skills','2025-05-14 05:43:46'),(145,56,'profile_update','Updated interests','2025-05-14 05:43:46'),(146,54,'profile_update','Updated profile information','2025-05-14 05:43:56'),(147,53,'profile_update','Updated skills','2025-05-14 05:43:58'),(148,53,'profile_update','Updated interests','2025-05-14 05:43:58'),(149,54,'profile_update','Updated skills','2025-05-14 05:44:11'),(150,54,'profile_update','Updated interests','2025-05-14 05:44:11'),(151,56,'profile_update','Updated skills','2025-05-14 05:44:14'),(152,56,'profile_update','Updated interests','2025-05-14 05:44:14'),(153,54,'profile_update','Updated profile information','2025-05-14 05:44:27'),(154,55,'profile_update','Updated skills','2025-05-14 05:46:38'),(155,55,'profile_update','Updated interests','2025-05-14 05:46:38'),(156,55,'profile_update','Updated profile information','2025-05-14 05:47:35'),(157,55,'profile_update','Updated profile information','2025-05-14 05:48:02');
/*!40000 ALTER TABLE `user_activities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_interests`
--

DROP TABLE IF EXISTS `user_interests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_interests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `interest` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_interests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_interests`
--

LOCK TABLES `user_interests` WRITE;
/*!40000 ALTER TABLE `user_interests` DISABLE KEYS */;
INSERT INTO `user_interests` VALUES (7,6,'Cybersecurity Basics','2025-04-24 00:08:01'),(15,2,'Video Editing (Premiere Pro, CapCut)','2025-04-25 07:18:31'),(16,2,'Public Speaking & Communication','2025-04-25 07:18:31'),(17,2,'Photography & Videography','2025-04-25 07:18:31'),(18,2,'Physics Fundamentals','2025-04-25 07:18:31'),(21,4,'Admin','2025-04-25 15:25:07'),(22,15,'Mathematics (Algebra, Calculus, Trigonometry)','2025-05-05 03:43:32'),(23,15,'Chemistry Basics','2025-05-05 03:43:32'),(24,15,'Financial Literacy & Budgeting','2025-05-05 03:43:32'),(25,15,'Physics Fundamentals','2025-05-05 03:43:32'),(26,17,'Entrepreneurship Basics','2025-05-05 03:45:56'),(27,23,'C++ Programming','2025-05-05 03:47:48'),(28,23,'Mobile App Development','2025-05-05 03:47:48'),(29,24,'C++ Programming','2025-05-05 03:47:55'),(30,24,'Mobile App Development','2025-05-05 03:47:55'),(31,5,'test','2025-05-08 16:36:56'),(32,5,'Python Programming','2025-05-08 16:36:56'),(33,5,'PHP & MySQL','2025-05-08 16:36:56'),(39,54,'C++ Programming','2025-05-14 05:44:11'),(40,56,'Photography & Videography','2025-05-14 05:44:14'),(41,56,'Graphic Design (Canva, Photoshop)','2025-05-14 05:44:14'),(42,56,'Guitar Basics','2025-05-14 05:44:14');
/*!40000 ALTER TABLE `user_interests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_settings`
--

DROP TABLE IF EXISTS `user_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `profile_visibility` enum('all','none') DEFAULT 'all',
  `show_skills` tinyint(1) DEFAULT '1',
  `show_interests` tinyint(1) DEFAULT '1',
  `allow_messages` enum('all','none') DEFAULT 'all',
  `default_mic_state` tinyint(1) DEFAULT '1',
  `default_camera_state` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `user_settings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_settings`
--

LOCK TABLES `user_settings` WRITE;
/*!40000 ALTER TABLE `user_settings` DISABLE KEYS */;
INSERT INTO `user_settings` VALUES (1,5,'all',1,1,'all',0,0,'2025-04-20 22:54:07','2025-04-22 03:07:10'),(2,6,'all',1,1,'all',0,0,'2025-04-20 22:54:07','2025-04-21 10:17:48'),(3,2,'all',1,1,'all',1,1,'2025-04-25 15:20:58','2025-04-25 15:20:58'),(4,7,'all',1,1,'all',1,1,'2025-05-02 06:32:37','2025-05-02 06:32:37'),(5,26,'all',1,1,'all',1,1,'2025-05-05 06:14:12','2025-05-05 06:14:12'),(6,46,'all',1,1,'all',0,0,'2025-05-13 03:19:08','2025-05-13 03:19:08'),(7,56,'all',1,1,'all',1,0,'2025-05-14 05:44:55','2025-05-14 05:44:55');
/*!40000 ALTER TABLE `user_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `profile_picture` varchar(255) DEFAULT NULL,
  `bio` text,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `phone_number` varchar(20) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (2,'Kim','Casapao','kim@gmail.com','$2b$10$mEtDgbWSIere5jR7k8LjCO8kc9l/46dpdTnVzoS4./.Ik4NxccJHm','/user1.png','Hello, I\'m Kim Casapao','user','2025-03-20 04:19:48','2025-05-15 13:30:17','09123456789','Bay, Laguna','2025-05-15 13:30:17'),(3,'morri','casapao','m@g.com','$2b$10$k5sItXrlWNkrMsyRNgFptOvtxJKH1.zPU/InToWs5oq./LIkxyLC2',NULL,NULL,'user','2025-03-23 19:54:21','2025-04-17 23:08:54',NULL,NULL,'2025-04-17 23:08:54'),(4,'SkillConnect','Admin','admin@gmail.com','$2b$10$K3T5kzPIVY4Akd7ZOME.MeUjQV4TOmLT.Qeb3L5ZfiZ7TQ9uEvetC','https://static.vecteezy.com/system/resources/thumbnails/019/194/935/small_2x/global-admin-icon-color-outline-vector.jpg',NULL,'admin','2025-03-25 21:39:01','2025-04-25 15:19:56','09876543210','TRACE College','2025-04-02 06:30:42'),(5,'ace','albao','ace@gmail.com','$2b$10$nE.bJuC2qoSFYlYlbSHqb.wq4l6BD3FJ/ihzCii4R3Mq.s8tq9DH6','/uploads/profile-5-5512bd15-f0e9-419a-969f-cbb6d52c6516.gif','hello','user','2025-04-20 10:33:30','2025-05-15 13:45:30','09605171999','Bay, Laguna','2025-05-15 13:45:30'),(6,'andrei','morri','morri@gmail.com','$2b$10$QWwIvMcf50NSlKWk21LXcubnPCXHT/3S1OuA1lTBDFF3gDtOlriT.','/uploads/profile-6-ccc72593-5f35-403f-be22-782f05d7e48e.png','dsadsa','user','2025-04-20 10:33:47','2025-05-08 15:08:54','09876543210','Bay, Laguna','2025-05-08 15:08:54'),(7,'Brian','Agnes','brian@gmail.com','$2b$10$6g/SvSeLjz3F.KQTM7kzResKgvOXLL3JS7Iqh4Ig4eJ0P.GnlX74i','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZtDPfbfcQ1W5nqCkYv6kkiIA4HShNyFgQTA&s',NULL,'user','2025-05-02 06:31:18','2025-05-02 06:43:27','09876543210','TRACE College','2025-05-02 06:43:27'),(8,'JB','Torres','jb@gmail.com','$2b$10$JXDqyhhqJaQSYO7/BwflTuVUZoBlFrVpJF5xVZ0tzITpogeVKRbuK','https://wallpapers.com/images/hd/minecraft_-steve_-head_-closeup-k10xp5s118h5l2fj.jpg',NULL,'user','2025-05-02 06:44:42','2025-05-05 02:14:29',NULL,NULL,'2025-05-05 02:14:29'),(9,'Erick','Monserrat','erick@gmail.com','$2b$10$7s0e8fC6gZOQundZqRDmG.uLS1kummXNZu.c34NV1g0B.4QesOZJy',NULL,NULL,'user','2025-05-02 06:45:08','2025-05-02 06:45:08',NULL,NULL,NULL),(10,'Neon','Suiton','neon@gmail.com','$2b$10$hsOBQMPkIoG9dTRKxTJwX.8dCH1ItLTlaMKEAW.WJenr2l8zXz/xq',NULL,NULL,'user','2025-05-02 06:45:24','2025-05-02 06:45:24',NULL,NULL,NULL),(11,'Jzy','Reyes','jzy@gmail.com','$2b$10$n7B0nj.WcxZ1xYSHwlB1vO2gE3.81xjqjkgTLMJ.m1/8L5H1C2P22',NULL,NULL,'user','2025-05-02 06:45:49','2025-05-05 02:31:50',NULL,NULL,'2025-05-05 02:31:50'),(12,'Yvan','Rayos','yvan@gmail.com','$2b$10$FXaJnOMW7PZuDVKguLMoK.VvsZhlRCXB5SWvHTjStDc7WjTZyxkHy','/uploads/profile-12-87907334-c032-4042-a083-66f999712360.jpg',NULL,'user','2025-05-02 06:56:05','2025-05-02 06:58:19',NULL,NULL,NULL),(13,'rich','elle','richelle@gmail.com','$2b$10$AASWIFqdKvZJSgBpebyKauiiBM0nnFkvHO2h64GwzgyuGaBOFtl2O',NULL,NULL,'user','2025-05-02 06:57:24','2025-05-02 06:57:24',NULL,NULL,NULL),(14,'Love Joy','Rallos','lrallos@gmail.com','$2b$10$o5blRHMwehH07H5aa5iNke.O3eXrYexnnFg7xegTSYqSYlKR.6U/y','/uploads/profile-14-d93868e8-29d1-42c2-97de-a4c49f9098f1.webp',NULL,'user','2025-05-02 07:07:34','2025-05-02 07:08:05',NULL,NULL,NULL),(15,'Shayne ','Perez','shaynedillean0226@gmail.com','$2b$10$TotxKcD6zt8F9g9tLAAUi.PVrve.nOB/zTXWYv1UyGRQJnks5D5E.',NULL,NULL,'user','2025-05-05 03:34:42','2025-05-05 03:34:42',NULL,NULL,NULL),(16,'Errine','Kampitan','kampitanerrineleigh@gmail.com','$2b$10$SFhsp00QhH3tXPBLh87a5efpAS1dKQKdXzWy6nRg.MkdO/BinVLRC',NULL,NULL,'user','2025-05-05 03:34:47','2025-05-05 03:34:47',NULL,NULL,NULL),(17,'julienne','sarmiento','juliennelee24@gmail.com','$2b$10$EY5leAzulgnmhVwDr/oGHu6fvsqSzDyEgpW4a/Zo5lh.pBJMKiNve',NULL,NULL,'user','2025-05-05 03:35:09','2025-05-05 03:35:09',NULL,NULL,NULL),(18,'Franchesca ','Mendoza','franchescamendoza999@gmail.com','$2b$10$cPUjBRx.1ZQb1jya5xgFlu4nuT5nk8Tsp2VccLKBuoYbXEw28yVWy',NULL,NULL,'user','2025-05-05 03:35:13','2025-05-05 03:35:13',NULL,NULL,NULL),(19,'Angelique','Corpuz','angeliquecorpuz27@gmail.com','$2b$10$8zei1xjL.0ghICBY9oOrd.GUkXxENNRwtvTD9BOIf8u/eINfTzJwS',NULL,NULL,'user','2025-05-05 03:35:21','2025-05-05 03:35:21',NULL,NULL,NULL),(20,'kerl','verdera','kdeocampo@tracecollege.edu.ph','$2b$10$GiFcQvqsp33aCZzlCRQITuhRQFiSBl6yOMve.0trk/7aFCqm5KZKe',NULL,NULL,'user','2025-05-05 03:42:04','2025-05-05 03:44:59',NULL,NULL,NULL),(21,'Daniel ','Pronda','daniepronda242@gmail.com','$2b$10$sdcGdk3hBhgBaH984joG.ubm.hHtUGgD7395jYyO.Tsz4I5EpR9Pu',NULL,NULL,'user','2025-05-05 03:42:04','2025-05-05 03:42:04',NULL,NULL,NULL),(22,'nam','verdera','rverdera@tracecollege.edu.ph','$2b$10$dVK4rVgx1MfUi/ZvWNchX..WxgLSNm2RDxgtCSGNwlEI2ekxxgdAG',NULL,NULL,'user','2025-05-05 03:42:11','2025-05-05 03:52:32',NULL,NULL,'2025-05-05 03:52:32'),(23,'Michaella','Baccay','mbaccay@tracecollege.edu.ph','$2b$10$5FBwOJZksch1XkZKRWh1JOi.pgUct4ZYNYmYhW5EC11CDO/.jkNRe',NULL,NULL,'user','2025-05-05 03:42:14','2025-05-05 03:51:06',NULL,NULL,'2025-05-05 03:51:06'),(24,'Bea','Alday','beakirsten30@gmail.com','$2b$10$GIkshM/OJBGqOcKx/ejf9.AgD14PdozQcaOKPKKrGSNia.8Pmocoe',NULL,NULL,'user','2025-05-05 03:42:21','2025-05-05 03:42:21',NULL,NULL,NULL),(25,'Eren','Yeager','yeager@gmail.com','$2b$10$SspGLFSqkfMLzgLtkT2s2OQqTAT69VvndNENWP.g54ieK61gblJ7u',NULL,NULL,'user','2025-05-05 05:21:13','2025-05-05 05:21:13',NULL,NULL,NULL),(26,'kiel','comendador','kviray@tracecollege.edu.ph','$2b$10$DjbPNgrpGvoQ/WQKTykG4uEliKCVnO8NciV1LbYyCOpillm8ypzuC',NULL,NULL,'user','2025-05-05 06:05:44','2025-05-05 06:05:44',NULL,NULL,NULL),(27,'Francis Joshua','Melgarejo','fmelgarejo@tracecollege.edu.ph','$2b$10$u2LYrt2vm1u0f55QrK8T5Oh.skFE4XcyO3.LhTElyE56rnYTRh25y',NULL,NULL,'user','2025-05-05 06:05:53','2025-05-05 06:05:53',NULL,NULL,NULL),(28,'Nustin Kim ','Sta Ana','nustinkim.cortez@gmail.com','$2b$10$p6k3is6xVFHVzdgPXGfOqu01b9CsK8BEULqEtuSMdaA/DH0Zkv2xC',NULL,NULL,'user','2025-05-05 06:05:55','2025-05-05 06:05:55',NULL,NULL,NULL),(29,'eightria','mendoza','emendoza2@tracecollege.edu.ph','$2b$10$YAKRc6baiqoSqdy2MIbBne4my4eSGYNcTnMQXqtGDzNL/a4//EiR.',NULL,NULL,'user','2025-05-05 06:06:14','2025-05-05 06:06:14',NULL,NULL,NULL),(30,'James','Marquez','jmarquez3@tracecollege.edu.ph','$2b$10$GOp4B4.a6mCTa/f68K8JeuhRFj7x3m8LK.2vc9fj9xUe.WKSs648m',NULL,NULL,'user','2025-05-05 06:06:44','2025-05-05 06:06:44',NULL,NULL,NULL),(31,'Francheska','Teodoro','fteodoro@tracecollge.edu.com','$2b$10$KCzzr17zgIQp.XMQy9VEreix2LiqR5Qx1.HVlrYEAQf9nyEGAk4nG',NULL,NULL,'user','2025-05-05 06:07:09','2025-05-05 06:07:09',NULL,NULL,NULL),(32,'ashley','dioso','eightriamendoza8@gmail.com','$2b$10$MvhujcfPjINwCKlrt.6/L.ouNlP318PBWBGLmFHTfZe0c50O4m8vu',NULL,NULL,'user','2025-05-05 06:07:17','2025-05-05 06:07:17',NULL,NULL,NULL),(33,'LeBron','Cena','mronquillo@tracecollege.edu.ph','$2b$10$pjagbcv3Zoipob6.ehQmhuqnp78S7BoOAjqcQaRQ/VmI6qlWTC772',NULL,NULL,'user','2025-05-05 06:08:15','2025-05-05 06:12:42',NULL,NULL,NULL),(34,'wesley','silvestre','wsilvestre@tracecollege.edu.ph','$2b$10$Tav8iMaGOhvHaAZG90NJZ.dYPXo70FrnF7U7rTQ86KZ/rHMWN1aKu',NULL,NULL,'user','2025-05-05 06:08:29','2025-05-05 06:09:31',NULL,NULL,'2025-05-05 06:09:31'),(35,'jefferson','punzalan','jpunzalan2@tracecollege.edu.ph','$2b$10$CbUZyc8zj7VvtHE78BP9wezsd1oJRwkw0KN.8Xdnu5nXf9SvyCRH6','/uploads/profile-35-2b3d7d25-aac6-4e07-b414-9f246fd0b10d.jpg',NULL,'user','2025-05-05 06:08:32','2025-05-05 06:10:46',NULL,NULL,'2025-05-05 06:10:46'),(36,'Gov &','tenorio','marilyntenorio6357@gmail.com','$2b$10$j1yuPGzJYN/BXgMTzI/21.wYS0IhcQapxRsAD28JfPvMrhFyQWrse',NULL,NULL,'user','2025-05-05 06:09:59','2025-05-05 06:12:14',NULL,NULL,NULL),(37,'Selwyn ','Cortez','scortez@tracecollege.edu.ph','$2b$10$keCjvskTL./cOCA8UUehSORo/fFugQt2tnPHUJvk/tlFGfD0CXCUC',NULL,NULL,'user','2025-05-05 06:49:48','2025-05-05 06:51:15',NULL,NULL,'2025-05-05 06:51:15'),(38,'Zeus Max','Banasihan','zbanasihan@tracecollege.edu.ph','$2b$10$9hXSNBXL1NXPoRekzhjEluWTA/7OfR/eUFxSBeIU9CKDvEPeAi2Hi',NULL,NULL,'user','2025-05-05 06:50:26','2025-05-05 06:50:26',NULL,NULL,NULL),(39,'James Crypton','Gulla','jamesgulla938@gmail.com','$2b$10$xNnwpEvihgcrlu8BOkLWi.d461N8gkYDdx3AnFjAUripaCcjLGaRW',NULL,NULL,'user','2025-05-05 06:50:36','2025-05-05 06:50:36',NULL,NULL,NULL),(40,'frich ganda','','frichluckylove09@gmail.com','$2b$10$rZ6rRkYRbDVf7DMEsBdNE.MLXzmt10cXLXV/AD4nZDCQLu7MDA11K',NULL,NULL,'user','2025-05-05 06:51:04','2025-05-05 06:52:25',NULL,NULL,NULL),(41,'xena Patricia Elizabeth','Seckignton-Wright','xseckington-wright@tracecollege.edu.ph','$2b$10$7th7O/Ln2A3ozZuRK/CT3O8HEnMVt6vmc.kQ1QJyHejRBdU5SUIS6',NULL,NULL,'user','2025-05-05 06:51:38','2025-05-05 06:51:38',NULL,NULL,NULL),(43,'ramil','areola','ramilareola74@gmail.com','$2b$10$PAUnCnIlol4y42Wx/TaaNuatiKxzhdAXAEO7RqGmjKqPAkWW/e1hC',NULL,NULL,'user','2025-05-13 03:13:39','2025-05-13 03:14:38',NULL,NULL,'2025-05-13 03:14:38'),(44,'Shin','SHin','shin@gmail.com','$2b$10$E28opTdJPPANAW5NcJ.c4euTd5EHlR2Hbah8NpuEF6XSYeqZeKwQu',NULL,NULL,'user','2025-05-13 03:15:21','2025-05-13 03:15:21',NULL,NULL,NULL),(46,'Marius Aethan','Alana','seth_alana@yahoo.com','$2b$10$sRuxRchgu89L9AnTB0zVAeo8BGb2Jrrv56gXv1LTWzx9ifssrQPdS',NULL,NULL,'user','2025-05-13 03:18:07','2025-05-13 03:19:17',NULL,NULL,'2025-05-13 03:19:17'),(47,'Althea','Arraz','aarraz.f2f@tracecollege.edu.ph','$2b$10$E2XSu9Kynfk7oR77lzp/ceTtPxl5eN1lY3HjHFnrXr.Z6sSH626XW',NULL,NULL,'user','2025-05-13 03:18:17','2025-05-13 03:18:17',NULL,NULL,NULL),(48,'qwerty','sigma','qwerty23@gmail.com','$2b$10$e6.QiMedOvs5NhM9/OLq9eMSYLxoeaiM4bHyilbCFGJgtk2grlxl2',NULL,NULL,'user','2025-05-13 03:18:40','2025-05-13 03:19:40',NULL,NULL,'2025-05-13 03:19:40'),(49,'Lowella Gaele','Herrera','lowellagaeleh@gmail.com','$2b$10$mgVrkfXJ7hyaORcA.sOcw.RUtIni0X37oST/zNMUxsoOHl8u/lOj6',NULL,NULL,'user','2025-05-13 03:49:57','2025-05-13 03:49:57',NULL,NULL,NULL),(50,'Jeressa','Cabil','jcabil@tracecollege.edu.ph','$2b$10$2JpT5wq3kahEhPvpgQxZBOHQefb4FZ5LVBhiBI0pYm2VdcUg.pPtC',NULL,NULL,'user','2025-05-13 03:50:07','2025-05-13 03:50:07',NULL,NULL,NULL),(51,'Ryan Jay','Gino-gino','rginoginotclb@gmail.com','$2b$10$/WAN2QzqOkypDispxdkz0ud2CkoorUI9VXDXtplwEx11lFuqtRMt6',NULL,NULL,'user','2025-05-13 04:01:25','2025-05-13 04:03:44',NULL,NULL,'2025-05-13 04:03:44'),(52,'Crimson','User','crimson@mail.com','$2b$10$iJX77FzA3BW9zKzQHw3A7e7Wf/iuDa0LLkeI4/AIocC/TRKFWFzMq',NULL,NULL,'user','2025-05-14 05:40:31','2025-05-14 05:48:39',NULL,NULL,'2025-05-14 05:48:39'),(53,'Zeus Kenneth','Lizarondo','zlizarondo@tracecollege.edu.ph','$2b$10$AhmQNnjwn77ZHf862MapCehFvNMcBvCJEsDAMnNz20wMZ5lnwoCCu','/uploads/profile-53-16e6bca0-690f-482f-94e6-cfc2768bd890.jfif','hello\n','user','2025-05-14 05:40:51','2025-05-14 05:44:57','09454552214','TRACE College','2025-05-14 05:44:57'),(54,'Jhon Chester','Dela Cueva','jdelacueva@tracecollege.edu.ph','$2b$10$5CHx/5ufD/Je/71rNzQXSuufteEO.mXXzIAxU4nZY3ndHA3Z0WPw2','/uploads/profile-54-5abc6198-189b-465b-ac8a-7a4f562b6bf9.png','Can do basic video editing and photo editing','user','2025-05-14 05:40:53','2025-05-14 05:44:27',NULL,NULL,NULL),(55,'Jack Daniel',' Pineda','techhubph01@gmail.com','$2b$10$RCboAfVgjEiNzmYMkK3jLus2.8YT307hw9ONhU8MaDMppKGcU1RLe','/uploads/profile-55-a0c8fdd5-dd4b-466f-b38d-d84b127dcc17.jpg','asawa q','user','2025-05-14 05:40:53','2025-05-14 05:48:02',NULL,NULL,'2025-05-14 05:46:05'),(56,'Matt','Lim','mclim@tracecollege.edu.ph','$2b$10$I1iayAgncLnKDXh9XJvvTeMbHG1MLmHnlH55wtjxt5e0ngcpMDVHC',NULL,NULL,'user','2025-05-14 05:40:55','2025-05-14 05:40:55',NULL,NULL,NULL),(57,'Kyle','Esteves','kesteves@tracecollege.edu.ph','$2b$10$p1DyZQY0GoVVMWtthKLvx.Su1B0ns/WeuBnfbMdgwFpTaLIgmji/G',NULL,NULL,'user','2025-05-14 05:41:35','2025-05-14 05:41:35',NULL,NULL,NULL);
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

-- Dump completed on 2025-05-16  0:41:21
