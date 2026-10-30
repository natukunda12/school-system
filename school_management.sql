-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 29, 2026 at 03:55 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `school_management`
--

-- --------------------------------------------------------

--
-- Table structure for table `academic_years`
--

CREATE TABLE `academic_years` (
  `id` smallint(5) UNSIGNED NOT NULL,
  `name` varchar(20) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_current` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `academic_years`
--

INSERT INTO `academic_years` (`id`, `name`, `start_date`, `end_date`, `is_current`) VALUES
(1, '2026', '2026-10-10', '2026-10-12', 1),
(9, '2027/2028', '2027-01-02', '2028-04-27', 0);

-- --------------------------------------------------------

--
-- Table structure for table `account_verifications`
--

CREATE TABLE `account_verifications` (
  `id` int(10) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL,
  `channel` enum('email','phone') NOT NULL,
  `code_hash` varchar(255) NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `account_verifications`
--

INSERT INTO `account_verifications` (`id`, `student_id`, `channel`, `code_hash`, `attempts`, `expires_at`, `used_at`) VALUES
(3, 4, 'phone', '-', 0, '2026-10-27 15:58:27', '2026-10-27 15:29:39');

-- --------------------------------------------------------

--
-- Table structure for table `arrivals`
--

CREATE TABLE `arrivals` (
  `id` int(10) UNSIGNED NOT NULL,
  `registration_id` int(10) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL,
  `term_id` smallint(5) UNSIGNED NOT NULL,
  `bed_id` int(10) UNSIGNED DEFAULT NULL,
  `table_id` smallint(5) UNSIGNED DEFAULT NULL,
  `arrived_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `recorded_by` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `arrivals`
--

INSERT INTO `arrivals` (`id`, `registration_id`, `student_id`, `term_id`, `bed_id`, `table_id`, `arrived_at`, `recorded_by`) VALUES
(1, 1, 4, 3, NULL, NULL, '2026-10-27 14:12:42', 1),
(2, 2, 5, 3, NULL, NULL, '2026-10-27 14:40:37', 7),
(3, 3, 6, 3, 1, NULL, '2026-10-27 16:00:58', 1),
(4, 4, 7, 1, 1, NULL, '2026-10-28 03:55:31', 1);

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `action` varchar(80) NOT NULL,
  `entity` varchar(50) DEFAULT NULL,
  `entity_id` int(10) UNSIGNED DEFAULT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES
(1, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-27 10:48:28'),
(2, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-27 11:55:37'),
(3, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-27 11:55:38'),
(4, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-27 11:56:00'),
(5, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-27 11:56:02'),
(6, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-27 11:58:07'),
(7, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-27 11:58:09'),
(8, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-27 11:58:10'),
(9, 1, 'LOGIN', 'user', 1, NULL, '::ffff:127.0.0.1', '2026-10-27 12:08:15'),
(10, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-27 12:09:36'),
(11, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-27 12:10:32'),
(12, 1, 'LOGIN', 'user', 1, NULL, '::ffff:127.0.0.1', '2026-10-27 12:13:28'),
(13, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-27 12:15:51'),
(14, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-27 12:16:30'),
(15, 1, 'CREATE_REQUIREMENT', 'requirement', 1, NULL, '::1', '2026-10-27 12:22:59'),
(16, 1, 'CREATE_USER', 'user', 2, '{\"role\":\"staff\"}', '::1', '2026-10-27 12:26:39'),
(17, NULL, 'LOGIN', 'user', 2, NULL, '::1', '2026-10-27 12:26:59'),
(18, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-27 12:28:22'),
(19, 1, 'CREATE_YEAR', 'academic_year', 1, NULL, '::1', '2026-10-27 12:30:53'),
(20, 1, 'CREATE_STUDENT', 'student', 1, '{\"code\":\"STU-2026-0001\"}', '::1', '2026-10-27 12:35:46'),
(21, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-27 13:04:38'),
(22, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-27 13:11:19'),
(23, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-27 13:12:14'),
(24, 1, 'CREATE_STUDENT', 'student', 2, '{\"code\":\"STU-2026-0002\"}', '::1', '2026-10-27 13:13:54'),
(25, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-27 13:15:23'),
(26, 1, 'UPDATE_STUDENT', 'student', 1, '[\"id\",\"student_code\",\"user_id\",\"full_name\",\"gender\",\"date_of_birth\",\"place_of_birth\",\"email\",\"phone\",\"previous_school\",\"photo_path\",\"current_class_id\",\"current_combination_id\",\"boarding_status\",\"status\",\"created_by\",\"created_at\",\"updated_at\",\"class_name\",\"combination\",\"class_id\",\"combination_id\"]', '::1', '2026-10-27 13:15:53'),
(27, 1, 'CREATE_STUDENT', 'student', 3, '{\"code\":\"STU-2026-0003\"}', '::1', '2026-10-27 13:17:41'),
(28, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-27 13:19:12'),
(29, 1, 'CREATE_STUDENT', 'student', 4, '{\"code\":\"STU-2026-0001\"}', '::1', '2026-10-27 13:27:03'),
(30, 6, 'LOGIN', 'user', 6, NULL, '::1', '2026-10-27 13:29:59'),
(31, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-27 13:31:35'),
(32, 1, 'CREATE_REQUIREMENT', 'requirement', 2, NULL, '::1', '2026-10-27 13:32:19'),
(33, 1, 'CREATE_REQUIREMENT', 'requirement', 3, NULL, '::1', '2026-10-27 13:33:04'),
(34, 1, 'CREATE_REQUIREMENT', 'requirement', 4, NULL, '::1', '2026-10-27 13:33:24'),
(35, 1, 'CREATE_TERM', 'term', 1, NULL, '::1', '2026-10-27 13:36:03'),
(36, 1, 'CREATE_TERM', 'term', 3, NULL, '::1', '2026-10-27 13:36:24'),
(37, 1, 'REGISTER_STUDENT', 'registration', 1, NULL, '::1', '2026-10-27 13:51:11'),
(38, 1, 'SET_CURRENT_TERM', 'term', 3, NULL, '::1', '2026-10-27 13:55:43'),
(39, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-27 13:59:37'),
(40, 1, 'LOGIN', 'user', 1, NULL, '::ffff:127.0.0.1', '2026-10-27 14:08:58'),
(41, 1, 'CREATE_DORMITORY', 'dormitory', 1, '{\"bunks\":100}', '::1', '2026-10-27 14:09:45'),
(42, 1, 'CREATE_TABLES', 'refectory_table', NULL, '{\"count\":150,\"capacity\":10}', '::1', '2026-10-27 14:10:26'),
(43, 1, 'CREATE_TABLES', 'refectory_table', NULL, '{\"count\":150,\"capacity\":10}', '::1', '2026-10-27 14:10:32'),
(44, 1, 'REPORT_ARRIVAL', 'arrival', 1, '{\"warnings\":0}', '::1', '2026-10-27 14:12:42'),
(45, 1, 'CHECK_REQUIREMENT', 'student_requirement', 3, '{\"status\":\"complete\"}', '::1', '2026-10-27 14:13:46'),
(46, 1, 'CHECK_REQUIREMENT', 'student_requirement', 2, '{\"status\":\"complete\"}', '::1', '2026-10-27 14:13:47'),
(47, 1, 'CHECK_REQUIREMENT', 'student_requirement', 1, '{\"status\":\"complete\"}', '::1', '2026-10-27 14:13:49'),
(48, 1, 'DEAN_CREATE_PERMISSION', 'permission_request', 1, NULL, '::1', '2026-10-27 14:18:31'),
(49, 1, 'SECRETARY_REJECT', 'permission_request', 1, NULL, '::1', '2026-10-27 14:18:53'),
(50, 1, 'DEAN_CREATE_PERMISSION', 'permission_request', 2, NULL, '::1', '2026-10-27 14:20:13'),
(51, 1, 'CREATE_USER', 'user', 7, '{\"role\":\"registrar\"}', '::1', '2026-10-27 14:22:02'),
(52, 7, 'LOGIN', 'user', 7, NULL, '::1', '2026-10-27 14:22:41'),
(53, 7, 'CREATE_DORMITORY', 'dormitory', 2, '{\"bunks\":15}', '::1', '2026-10-27 14:23:58'),
(54, 1, 'LOGIN', 'user', 1, NULL, '::ffff:127.0.0.1', '2026-10-27 14:31:43'),
(55, 7, 'CREATE_STUDENT', 'student', 5, '{\"code\":\"STU-2026-0002\"}', '::1', '2026-10-27 14:39:13'),
(56, 7, 'REPORT_ARRIVAL', 'arrival', 2, '{\"warnings\":0}', '::1', '2026-10-27 14:40:37'),
(57, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-27 14:45:21'),
(58, 1, 'LOGIN', 'user', 1, NULL, '::ffff:127.0.0.1', '2026-10-27 14:52:00'),
(59, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-27 14:59:39'),
(60, 1, 'ADD_BUNKS', 'dormitory', 1, '{\"add\":5}', '::1', '2026-10-27 15:00:06'),
(61, 1, 'CHECK_REQUIREMENT', 'student_requirement', 5, '{\"status\":\"complete\"}', '::1', '2026-10-27 15:58:52'),
(62, 1, 'CREATE_STUDENT', 'student', 6, '{\"code\":\"STU-2026-0003\"}', '::1', '2026-10-27 16:00:23'),
(63, 1, 'REPORT_ARRIVAL', 'arrival', 3, '{\"warnings\":0}', '::1', '2026-10-27 16:00:58'),
(64, 1, 'DEAN_CREATE_PERMISSION', 'permission_request', 3, NULL, '::1', '2026-10-27 16:03:11'),
(65, 1, 'CREATE_USER', 'user', 8, '{\"role\":\"dean_of_discipline\"}', '::1', '2026-10-27 16:06:05'),
(66, 8, 'LOGIN', 'user', 8, NULL, '::1', '2026-10-27 16:06:32'),
(67, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-27 16:20:32'),
(68, 6, 'LOGIN', 'user', 6, NULL, '::1', '2026-10-27 16:21:41'),
(69, 6, 'REQUEST_PERMISSION', 'permission_request', 4, NULL, '::1', '2026-10-27 16:22:52'),
(70, 8, 'LOGIN', 'user', 8, NULL, '::1', '2026-10-27 16:23:16'),
(71, 8, 'DEAN_APPROVE', 'permission_request', 4, NULL, '::1', '2026-10-27 16:23:32'),
(72, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-27 16:30:06'),
(73, 1, 'CREATE_REQUIREMENT', 'requirement', 5, NULL, '::1', '2026-10-27 16:32:31'),
(74, 1, 'CREATE_DORMITORY', 'dormitory', 3, '{\"bunks\":10}', '::1', '2026-10-27 16:36:13'),
(75, 1, 'ADD_BUNKS', 'dormitory', 3, '{\"add\":7}', '::1', '2026-10-27 16:36:31'),
(76, 1, 'SET_CURRENT_TERM', 'term', 1, NULL, '::1', '2026-10-27 16:56:32'),
(77, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-28 03:46:51'),
(78, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-28 03:48:48'),
(79, 1, 'CREATE_STUDENT', 'student', 7, '{\"code\":\"STU-2026-0004\"}', '::1', '2026-10-28 03:54:13'),
(80, 1, 'CHECK_REQUIREMENT', 'student_requirement', 13, '{\"status\":\"complete\"}', '::1', '2026-10-28 03:54:56'),
(81, 1, 'CHECK_REQUIREMENT', 'student_requirement', 12, '{\"status\":\"complete\"}', '::1', '2026-10-28 03:54:58'),
(82, 1, 'CHECK_REQUIREMENT', 'student_requirement', 11, '{\"status\":\"complete\"}', '::1', '2026-10-28 03:55:00'),
(83, 1, 'CHECK_REQUIREMENT', 'student_requirement', 15, '{\"status\":\"complete\"}', '::1', '2026-10-28 03:55:01'),
(84, 1, 'CHECK_REQUIREMENT', 'student_requirement', 14, '{\"status\":\"complete\"}', '::1', '2026-10-28 03:55:04'),
(85, 1, 'REPORT_ARRIVAL', 'arrival', 4, '{\"warnings\":0}', '::1', '2026-10-28 03:55:31'),
(86, 1, 'SET_CURRENT_TERM', 'term', 3, NULL, '::1', '2026-10-28 04:10:18'),
(87, 1, 'CREATE_YEAR', 'academic_year', 6, NULL, '::1', '2026-10-28 04:11:47'),
(88, 1, 'CREATE_YEAR', 'academic_year', 9, NULL, '::1', '2026-10-28 04:12:55'),
(89, 1, 'CREATE_TERM', 'term', 4, NULL, '::1', '2026-10-28 04:15:00'),
(90, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-28 04:24:38'),
(91, 1, 'SECRETARY_CONFIRM', 'permission_request', 4, NULL, '::1', '2026-10-28 04:30:37'),
(92, 1, 'SECRETARY_RETURN', 'permission_request', 3, NULL, '::1', '2026-10-28 04:30:50'),
(93, 8, 'LOGIN', 'user', 8, NULL, '::1', '2026-10-28 05:00:49'),
(94, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-28 07:14:14'),
(95, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-28 07:24:03'),
(96, 1, 'UPDATE_STUDENT', 'student', 4, '[\"id\",\"student_code\",\"user_id\",\"full_name\",\"gender\",\"date_of_birth\",\"place_of_birth\",\"email\",\"phone\",\"previous_school\",\"current_class_id\",\"current_combination_id\",\"boarding_status\",\"status\",\"created_at\",\"updated_at\",\"class_name\",\"combination\",\"class_id\",\"combination_id\"]', '::1', '2026-10-28 07:41:54'),
(97, 1, 'UPDATE_STUDENT_PHOTO', 'student', 6, NULL, '::1', '2026-10-28 08:44:56'),
(98, 1, 'UPDATE_STUDENT', 'student', 6, '[\"id\",\"student_code\",\"user_id\",\"full_name\",\"gender\",\"date_of_birth\",\"place_of_birth\",\"email\",\"phone\",\"previous_school\",\"current_class_id\",\"current_combination_id\",\"boarding_status\",\"status\",\"created_at\",\"updated_at\",\"class_name\",\"combination\",\"class_id\",\"combination_id\"]', '::1', '2026-10-28 08:45:12'),
(99, 1, 'UPDATE_STUDENT', 'student', 6, '[\"id\",\"student_code\",\"user_id\",\"full_name\",\"gender\",\"date_of_birth\",\"place_of_birth\",\"email\",\"phone\",\"previous_school\",\"current_class_id\",\"current_combination_id\",\"boarding_status\",\"status\",\"created_at\",\"updated_at\",\"class_name\",\"combination\",\"class_id\",\"combination_id\"]', '::1', '2026-10-28 08:45:17'),
(100, 1, 'UPDATE_STUDENT_PHOTO', 'student', 6, NULL, '::1', '2026-10-28 08:45:39'),
(101, 1, 'UPDATE_STUDENT', 'student', 6, '[\"id\",\"student_code\",\"user_id\",\"full_name\",\"gender\",\"date_of_birth\",\"place_of_birth\",\"email\",\"phone\",\"previous_school\",\"current_class_id\",\"current_combination_id\",\"boarding_status\",\"status\",\"created_at\",\"updated_at\",\"class_name\",\"combination\",\"class_id\",\"combination_id\"]', '::1', '2026-10-28 08:46:14'),
(102, 1, 'UPDATE_STUDENT', 'student', 7, '[\"id\",\"student_code\",\"user_id\",\"full_name\",\"gender\",\"date_of_birth\",\"place_of_birth\",\"email\",\"phone\",\"previous_school\",\"current_class_id\",\"current_combination_id\",\"boarding_status\",\"status\",\"created_at\",\"updated_at\",\"class_name\",\"combination\",\"class_id\",\"combination_id\"]', '::1', '2026-10-28 08:46:51'),
(103, 1, 'UPDATE_STUDENT_PHOTO', 'student', 7, NULL, '::1', '2026-10-28 08:47:04'),
(104, 1, 'UPDATE_STUDENT', 'student', 6, '[\"id\",\"student_code\",\"user_id\",\"full_name\",\"gender\",\"date_of_birth\",\"place_of_birth\",\"email\",\"phone\",\"previous_school\",\"current_class_id\",\"current_combination_id\",\"boarding_status\",\"status\",\"created_at\",\"updated_at\",\"class_name\",\"combination\",\"class_id\",\"combination_id\"]', '::1', '2026-10-28 08:49:03'),
(105, 1, 'UPDATE_STUDENT', 'student', 7, '[\"id\",\"student_code\",\"user_id\",\"full_name\",\"gender\",\"date_of_birth\",\"place_of_birth\",\"email\",\"phone\",\"previous_school\",\"current_class_id\",\"current_combination_id\",\"boarding_status\",\"status\",\"created_at\",\"updated_at\",\"class_name\",\"combination\",\"class_id\",\"combination_id\"]', '::1', '2026-10-28 08:50:07'),
(106, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-28 10:42:56'),
(107, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-28 10:48:07'),
(108, 1, 'UPDATE_STUDENT', 'student', 5, '[\"id\",\"student_code\",\"user_id\",\"full_name\",\"gender\",\"date_of_birth\",\"place_of_birth\",\"email\",\"phone\",\"previous_school\",\"current_class_id\",\"current_combination_id\",\"boarding_status\",\"status\",\"created_at\",\"updated_at\",\"class_name\",\"combination\",\"class_id\",\"combination_id\"]', '::1', '2026-10-28 10:48:50'),
(109, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-28 10:53:17'),
(110, 1, 'CREATE_USER', 'user', 9, '{\"role\":\"staff\"}', '::1', '2026-10-28 13:12:35'),
(111, 9, 'LOGIN', 'user', 9, NULL, '::1', '2026-10-28 13:12:57'),
(112, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-29 04:06:25'),
(113, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-29 06:01:47'),
(114, 1, 'UPDATE_STUDENT', 'student', 5, '[\"id\",\"student_code\",\"user_id\",\"full_name\",\"gender\",\"date_of_birth\",\"place_of_birth\",\"email\",\"phone\",\"previous_school\",\"current_class_id\",\"current_combination_id\",\"boarding_status\",\"status\",\"created_at\",\"updated_at\",\"class_name\",\"combination\",\"class_id\",\"combination_id\"]', '::1', '2026-10-29 06:02:31'),
(115, 1, 'UPDATE_STUDENT_PHOTO', 'student', 5, NULL, '::1', '2026-10-29 06:03:04'),
(116, 1, 'UPDATE_STUDENT_PHOTO', 'student', 4, NULL, '::1', '2026-10-29 06:03:35'),
(117, 1, 'UPDATE_STUDENT_PHOTO', 'student', 4, NULL, '::1', '2026-10-29 06:03:54'),
(118, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-29 09:49:25'),
(119, 1, 'LOGIN', 'user', 1, NULL, '::1', '2026-10-29 09:57:08');

-- --------------------------------------------------------

--
-- Table structure for table `beds`
--

CREATE TABLE `beds` (
  `id` int(10) UNSIGNED NOT NULL,
  `dormitory_id` smallint(5) UNSIGNED NOT NULL,
  `bed_number` smallint(5) UNSIGNED NOT NULL,
  `position` enum('A','B') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `beds`
--

INSERT INTO `beds` (`id`, `dormitory_id`, `bed_number`, `position`) VALUES
(1, 1, 1, 'A'),
(2, 1, 1, 'B'),
(3, 1, 2, 'A'),
(4, 1, 2, 'B'),
(5, 1, 3, 'A'),
(6, 1, 3, 'B'),
(7, 1, 4, 'A'),
(8, 1, 4, 'B'),
(9, 1, 5, 'A'),
(10, 1, 5, 'B'),
(11, 1, 6, 'A'),
(12, 1, 6, 'B'),
(13, 1, 7, 'A'),
(14, 1, 7, 'B'),
(15, 1, 8, 'A'),
(16, 1, 8, 'B'),
(17, 1, 9, 'A'),
(18, 1, 9, 'B'),
(19, 1, 10, 'A'),
(20, 1, 10, 'B'),
(21, 1, 11, 'A'),
(22, 1, 11, 'B'),
(23, 1, 12, 'A'),
(24, 1, 12, 'B'),
(25, 1, 13, 'A'),
(26, 1, 13, 'B'),
(27, 1, 14, 'A'),
(28, 1, 14, 'B'),
(29, 1, 15, 'A'),
(30, 1, 15, 'B'),
(31, 1, 16, 'A'),
(32, 1, 16, 'B'),
(33, 1, 17, 'A'),
(34, 1, 17, 'B'),
(35, 1, 18, 'A'),
(36, 1, 18, 'B'),
(37, 1, 19, 'A'),
(38, 1, 19, 'B'),
(39, 1, 20, 'A'),
(40, 1, 20, 'B'),
(41, 1, 21, 'A'),
(42, 1, 21, 'B'),
(43, 1, 22, 'A'),
(44, 1, 22, 'B'),
(45, 1, 23, 'A'),
(46, 1, 23, 'B'),
(47, 1, 24, 'A'),
(48, 1, 24, 'B'),
(49, 1, 25, 'A'),
(50, 1, 25, 'B'),
(51, 1, 26, 'A'),
(52, 1, 26, 'B'),
(53, 1, 27, 'A'),
(54, 1, 27, 'B'),
(55, 1, 28, 'A'),
(56, 1, 28, 'B'),
(57, 1, 29, 'A'),
(58, 1, 29, 'B'),
(59, 1, 30, 'A'),
(60, 1, 30, 'B'),
(61, 1, 31, 'A'),
(62, 1, 31, 'B'),
(63, 1, 32, 'A'),
(64, 1, 32, 'B'),
(65, 1, 33, 'A'),
(66, 1, 33, 'B'),
(67, 1, 34, 'A'),
(68, 1, 34, 'B'),
(69, 1, 35, 'A'),
(70, 1, 35, 'B'),
(71, 1, 36, 'A'),
(72, 1, 36, 'B'),
(73, 1, 37, 'A'),
(74, 1, 37, 'B'),
(75, 1, 38, 'A'),
(76, 1, 38, 'B'),
(77, 1, 39, 'A'),
(78, 1, 39, 'B'),
(79, 1, 40, 'A'),
(80, 1, 40, 'B'),
(81, 1, 41, 'A'),
(82, 1, 41, 'B'),
(83, 1, 42, 'A'),
(84, 1, 42, 'B'),
(85, 1, 43, 'A'),
(86, 1, 43, 'B'),
(87, 1, 44, 'A'),
(88, 1, 44, 'B'),
(89, 1, 45, 'A'),
(90, 1, 45, 'B'),
(91, 1, 46, 'A'),
(92, 1, 46, 'B'),
(93, 1, 47, 'A'),
(94, 1, 47, 'B'),
(95, 1, 48, 'A'),
(96, 1, 48, 'B'),
(97, 1, 49, 'A'),
(98, 1, 49, 'B'),
(99, 1, 50, 'A'),
(100, 1, 50, 'B'),
(101, 1, 51, 'A'),
(102, 1, 51, 'B'),
(103, 1, 52, 'A'),
(104, 1, 52, 'B'),
(105, 1, 53, 'A'),
(106, 1, 53, 'B'),
(107, 1, 54, 'A'),
(108, 1, 54, 'B'),
(109, 1, 55, 'A'),
(110, 1, 55, 'B'),
(111, 1, 56, 'A'),
(112, 1, 56, 'B'),
(113, 1, 57, 'A'),
(114, 1, 57, 'B'),
(115, 1, 58, 'A'),
(116, 1, 58, 'B'),
(117, 1, 59, 'A'),
(118, 1, 59, 'B'),
(119, 1, 60, 'A'),
(120, 1, 60, 'B'),
(121, 1, 61, 'A'),
(122, 1, 61, 'B'),
(123, 1, 62, 'A'),
(124, 1, 62, 'B'),
(125, 1, 63, 'A'),
(126, 1, 63, 'B'),
(127, 1, 64, 'A'),
(128, 1, 64, 'B'),
(129, 1, 65, 'A'),
(130, 1, 65, 'B'),
(131, 1, 66, 'A'),
(132, 1, 66, 'B'),
(133, 1, 67, 'A'),
(134, 1, 67, 'B'),
(135, 1, 68, 'A'),
(136, 1, 68, 'B'),
(137, 1, 69, 'A'),
(138, 1, 69, 'B'),
(139, 1, 70, 'A'),
(140, 1, 70, 'B'),
(141, 1, 71, 'A'),
(142, 1, 71, 'B'),
(143, 1, 72, 'A'),
(144, 1, 72, 'B'),
(145, 1, 73, 'A'),
(146, 1, 73, 'B'),
(147, 1, 74, 'A'),
(148, 1, 74, 'B'),
(149, 1, 75, 'A'),
(150, 1, 75, 'B'),
(151, 1, 76, 'A'),
(152, 1, 76, 'B'),
(153, 1, 77, 'A'),
(154, 1, 77, 'B'),
(155, 1, 78, 'A'),
(156, 1, 78, 'B'),
(157, 1, 79, 'A'),
(158, 1, 79, 'B'),
(159, 1, 80, 'A'),
(160, 1, 80, 'B'),
(161, 1, 81, 'A'),
(162, 1, 81, 'B'),
(163, 1, 82, 'A'),
(164, 1, 82, 'B'),
(165, 1, 83, 'A'),
(166, 1, 83, 'B'),
(167, 1, 84, 'A'),
(168, 1, 84, 'B'),
(169, 1, 85, 'A'),
(170, 1, 85, 'B'),
(171, 1, 86, 'A'),
(172, 1, 86, 'B'),
(173, 1, 87, 'A'),
(174, 1, 87, 'B'),
(175, 1, 88, 'A'),
(176, 1, 88, 'B'),
(177, 1, 89, 'A'),
(178, 1, 89, 'B'),
(179, 1, 90, 'A'),
(180, 1, 90, 'B'),
(181, 1, 91, 'A'),
(182, 1, 91, 'B'),
(183, 1, 92, 'A'),
(184, 1, 92, 'B'),
(185, 1, 93, 'A'),
(186, 1, 93, 'B'),
(187, 1, 94, 'A'),
(188, 1, 94, 'B'),
(189, 1, 95, 'A'),
(190, 1, 95, 'B'),
(191, 1, 96, 'A'),
(192, 1, 96, 'B'),
(193, 1, 97, 'A'),
(194, 1, 97, 'B'),
(195, 1, 98, 'A'),
(196, 1, 98, 'B'),
(197, 1, 99, 'A'),
(198, 1, 99, 'B'),
(199, 1, 100, 'A'),
(200, 1, 100, 'B'),
(231, 1, 101, 'A'),
(232, 1, 101, 'B'),
(233, 1, 102, 'A'),
(234, 1, 102, 'B'),
(235, 1, 103, 'A'),
(236, 1, 103, 'B'),
(237, 1, 104, 'A'),
(238, 1, 104, 'B'),
(239, 1, 105, 'A'),
(240, 1, 105, 'B'),
(201, 2, 1, 'A'),
(202, 2, 1, 'B'),
(203, 2, 2, 'A'),
(204, 2, 2, 'B'),
(205, 2, 3, 'A'),
(206, 2, 3, 'B'),
(207, 2, 4, 'A'),
(208, 2, 4, 'B'),
(209, 2, 5, 'A'),
(210, 2, 5, 'B'),
(211, 2, 6, 'A'),
(212, 2, 6, 'B'),
(213, 2, 7, 'A'),
(214, 2, 7, 'B'),
(215, 2, 8, 'A'),
(216, 2, 8, 'B'),
(217, 2, 9, 'A'),
(218, 2, 9, 'B'),
(219, 2, 10, 'A'),
(220, 2, 10, 'B'),
(221, 2, 11, 'A'),
(222, 2, 11, 'B'),
(223, 2, 12, 'A'),
(224, 2, 12, 'B'),
(225, 2, 13, 'A'),
(226, 2, 13, 'B'),
(227, 2, 14, 'A'),
(228, 2, 14, 'B'),
(229, 2, 15, 'A'),
(230, 2, 15, 'B'),
(241, 3, 1, 'A'),
(242, 3, 1, 'B'),
(243, 3, 2, 'A'),
(244, 3, 2, 'B'),
(245, 3, 3, 'A'),
(246, 3, 3, 'B'),
(247, 3, 4, 'A'),
(248, 3, 4, 'B'),
(249, 3, 5, 'A'),
(250, 3, 5, 'B'),
(251, 3, 6, 'A'),
(252, 3, 6, 'B'),
(253, 3, 7, 'A'),
(254, 3, 7, 'B'),
(255, 3, 8, 'A'),
(256, 3, 8, 'B'),
(257, 3, 9, 'A'),
(258, 3, 9, 'B'),
(259, 3, 10, 'A'),
(260, 3, 10, 'B'),
(261, 3, 11, 'A'),
(262, 3, 11, 'B'),
(263, 3, 12, 'A'),
(264, 3, 12, 'B'),
(265, 3, 13, 'A'),
(266, 3, 13, 'B'),
(267, 3, 14, 'A'),
(268, 3, 14, 'B'),
(269, 3, 15, 'A'),
(270, 3, 15, 'B'),
(271, 3, 16, 'A'),
(272, 3, 16, 'B'),
(273, 3, 17, 'A'),
(274, 3, 17, 'B');

-- --------------------------------------------------------

--
-- Table structure for table `classes`
--

CREATE TABLE `classes` (
  `id` smallint(5) UNSIGNED NOT NULL,
  `name` varchar(30) NOT NULL,
  `level` tinyint(3) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `classes`
--

INSERT INTO `classes` (`id`, `name`, `level`) VALUES
(1, 'sod', 5),
(2, 'sod level', 5),
(3, 'bdc', 3);

-- --------------------------------------------------------

--
-- Table structure for table `combinations`
--

CREATE TABLE `combinations` (
  `id` smallint(5) UNSIGNED NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `combinations`
--

INSERT INTO `combinations` (`id`, `code`, `name`) VALUES
(1, '501', 'software development'),
(2, 'sod', NULL),
(3, 'bdc', 'building and construction');

-- --------------------------------------------------------

--
-- Table structure for table `dormitories`
--

CREATE TABLE `dormitories` (
  `id` smallint(5) UNSIGNED NOT NULL,
  `name` varchar(80) NOT NULL,
  `gender` enum('Male','Female') NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `dormitories`
--

INSERT INTO `dormitories` (`id`, `name`, `gender`, `is_active`) VALUES
(1, 'DOM 1', 'Male', 1),
(2, 'dom', 'Male', 1),
(3, 'BOYS DOM2', 'Male', 1);

-- --------------------------------------------------------

--
-- Table structure for table `import_batches`
--

CREATE TABLE `import_batches` (
  `id` int(10) UNSIGNED NOT NULL,
  `import_type` enum('students_new','students_update') NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `total_rows` int(10) UNSIGNED DEFAULT 0,
  `valid_rows` int(10) UNSIGNED DEFAULT 0,
  `error_rows` int(10) UNSIGNED DEFAULT 0,
  `status` enum('uploaded','validated','confirmed','cancelled') NOT NULL DEFAULT 'uploaded',
  `error_report` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`error_report`)),
  `rows_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`rows_data`)),
  `uploaded_by` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `confirmed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `parents`
--

CREATE TABLE `parents` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `full_name` varchar(150) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `parents`
--

INSERT INTO `parents` (`id`, `user_id`, `full_name`, `phone`, `email`, `address`) VALUES
(1, NULL, 'mw', '0783004941', NULL, NULL),
(2, NULL, 'mmw', '0783004941', NULL, NULL),
(3, NULL, 'mn', '0792635595', NULL, NULL),
(4, NULL, 'mwizerwa', '0783004941', NULL, NULL),
(5, NULL, 'mama', '0783000000', NULL, NULL),
(6, NULL, 'nmnm', '0784000000', NULL, NULL),
(7, NULL, 'mmmmmm', '0793358571', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `permission_cards`
--

CREATE TABLE `permission_cards` (
  `id` int(10) UNSIGNED NOT NULL,
  `permission_request_id` int(10) UNSIGNED NOT NULL,
  `permission_number` varchar(30) NOT NULL,
  `verification_token` char(64) NOT NULL,
  `issued_by` int(10) UNSIGNED DEFAULT NULL,
  `issued_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `pdf_path` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `permission_cards`
--

INSERT INTO `permission_cards` (`id`, `permission_request_id`, `permission_number`, `verification_token`, `issued_by`, `issued_at`, `pdf_path`) VALUES
(1, 4, 'PRM-2026-000004', '1193c6f9797bd33a75e1b9f02ae1a24e804e32166f9e0605421d1be3acf08527', 1, '2026-10-28 04:30:37', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `permission_requests`
--

CREATE TABLE `permission_requests` (
  `id` int(10) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL,
  `destination` varchar(150) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `departure_at` datetime NOT NULL,
  `expected_return_at` datetime NOT NULL,
  `additional_info` text DEFAULT NULL,
  `document_path` varchar(255) DEFAULT NULL,
  `status` enum('pending','awaiting_confirmation','approved','rejected','returned','expired') NOT NULL DEFAULT 'pending',
  `reviewed_by` int(10) UNSIGNED DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `review_note` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `dean_id` int(10) UNSIGNED DEFAULT NULL,
  `dean_at` datetime DEFAULT NULL,
  `dean_note` varchar(255) DEFAULT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `permission_requests`
--

INSERT INTO `permission_requests` (`id`, `student_id`, `destination`, `reason`, `departure_at`, `expected_return_at`, `additional_info`, `document_path`, `status`, `reviewed_by`, `reviewed_at`, `review_note`, `created_at`, `dean_id`, `dean_at`, `dean_note`, `created_by`) VALUES
(1, 4, 'BURERA', 'SICK', '2026-10-27 16:18:00', '2026-10-29 16:18:00', 'SSSSS', NULL, 'rejected', 1, '2026-10-27 16:18:53', NULL, '2026-10-27 14:18:31', 1, '2026-10-27 16:18:31', NULL, 1),
(2, 4, 'bbb', 'sick', '2026-10-28 16:19:00', '2026-10-29 16:19:00', 'cvbnmn', NULL, 'awaiting_confirmation', NULL, NULL, NULL, '2026-10-27 14:20:13', 1, '2026-10-27 16:20:13', NULL, 1),
(3, 6, 'NYANZA', 'sick', '2026-10-27 18:02:00', '2026-10-28 18:02:00', 'sssss', NULL, 'returned', 1, '2026-10-28 06:30:50', NULL, '2026-10-27 16:03:11', 1, '2026-10-27 18:03:11', NULL, 1),
(4, 4, 'nyanza', 'sick', '2026-10-27 18:22:00', '2026-10-29 18:22:00', NULL, NULL, 'approved', 1, '2026-10-28 06:30:37', NULL, '2026-10-27 16:22:52', 8, '2026-10-27 18:23:32', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `permission_scans`
--

CREATE TABLE `permission_scans` (
  `id` int(10) UNSIGNED NOT NULL,
  `card_id` int(10) UNSIGNED NOT NULL,
  `scanned_by` int(10) UNSIGNED DEFAULT NULL,
  `scan_type` enum('verify','exit','return') NOT NULL DEFAULT 'verify',
  `scanned_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `refectory_tables`
--

CREATE TABLE `refectory_tables` (
  `id` smallint(5) UNSIGNED NOT NULL,
  `number` smallint(5) UNSIGNED NOT NULL,
  `capacity` smallint(5) UNSIGNED NOT NULL DEFAULT 10,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `registrations`
--

CREATE TABLE `registrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL,
  `academic_year_id` smallint(5) UNSIGNED NOT NULL,
  `term_id` smallint(5) UNSIGNED NOT NULL,
  `class_id` smallint(5) UNSIGNED NOT NULL,
  `combination_id` smallint(5) UNSIGNED DEFAULT NULL,
  `student_type` enum('new','returning') NOT NULL,
  `boarding_status` enum('boarding','day') NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `reviewed_by` int(10) UNSIGNED DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `review_note` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `registrations`
--

INSERT INTO `registrations` (`id`, `student_id`, `academic_year_id`, `term_id`, `class_id`, `combination_id`, `student_type`, `boarding_status`, `status`, `reviewed_by`, `reviewed_at`, `review_note`, `created_at`) VALUES
(1, 4, 1, 3, 1, 1, 'new', 'day', 'approved', 1, '2026-10-27 15:51:11', NULL, '2026-10-27 13:51:11'),
(2, 5, 1, 3, 2, 2, 'new', 'day', 'approved', 7, '2026-10-27 16:39:13', NULL, '2026-10-27 14:39:13'),
(3, 6, 1, 3, 2, NULL, 'new', 'boarding', 'approved', 1, '2026-10-27 18:00:23', NULL, '2026-10-27 16:00:23'),
(4, 7, 1, 1, 2, 2, 'new', 'boarding', 'approved', 1, '2026-10-28 05:54:13', NULL, '2026-10-28 03:54:13');

-- --------------------------------------------------------

--
-- Table structure for table `requirements`
--

CREATE TABLE `requirements` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `category` enum('item','document') NOT NULL DEFAULT 'item',
  `applies_to_type` enum('all','new','returning') NOT NULL DEFAULT 'all',
  `applies_to_boarding` enum('all','boarding','day') NOT NULL DEFAULT 'all',
  `term_id` smallint(5) UNSIGNED DEFAULT NULL,
  `class_id` smallint(5) UNSIGNED DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `requirements`
--

INSERT INTO `requirements` (`id`, `name`, `description`, `category`, `applies_to_type`, `applies_to_boarding`, `term_id`, `class_id`, `is_active`, `created_at`) VALUES
(1, 'matres', NULL, 'item', 'new', 'all', NULL, NULL, 1, '2026-10-27 12:22:59'),
(2, 'indobo', NULL, 'item', 'all', 'all', NULL, NULL, 1, '2026-10-27 13:32:19'),
(3, 'imeza', NULL, 'item', 'all', 'all', NULL, NULL, 1, '2026-10-27 13:33:04'),
(4, 'umusanzu', NULL, 'item', 'all', 'boarding', NULL, NULL, 1, '2026-10-27 13:33:24'),
(5, 'matres', NULL, 'item', 'new', 'boarding', 1, NULL, 1, '2026-10-27 16:32:31');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` tinyint(3) UNSIGNED NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'super_admin', 'Highest access, manages whole system'),
(2, 'registrar', 'Manages students, registration and permissions'),
(3, 'staff', 'Authorized staff: verify requirements and permissions'),
(4, 'student', 'Student account'),
(5, 'parent', 'Parent or guardian account'),
(11, 'dean_of_discipline', 'Recommends student permissions'),
(12, 'secretary', 'Confirms permissions');

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `setting_key` varchar(80) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` int(10) UNSIGNED NOT NULL,
  `student_code` varchar(20) NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `full_name` varchar(150) NOT NULL,
  `gender` enum('Male','Female') NOT NULL,
  `date_of_birth` date NOT NULL,
  `place_of_birth` varchar(100) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `previous_school` varchar(150) DEFAULT NULL,
  `photo_path` varchar(255) DEFAULT NULL,
  `current_class_id` smallint(5) UNSIGNED DEFAULT NULL,
  `current_combination_id` smallint(5) UNSIGNED DEFAULT NULL,
  `boarding_status` enum('boarding','day') NOT NULL DEFAULT 'day',
  `status` enum('active','graduated','transferred','suspended') NOT NULL DEFAULT 'active',
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `qr_token` char(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `student_code`, `user_id`, `full_name`, `gender`, `date_of_birth`, `place_of_birth`, `email`, `phone`, `previous_school`, `photo_path`, `current_class_id`, `current_combination_id`, `boarding_status`, `status`, `created_by`, `created_at`, `updated_at`, `qr_token`) VALUES
(4, 'STU-2026-0001', 6, 'Natakunda Vincent', 'Male', '2026-10-14', 'burera', 'natakundavincent@gmail.com', '0783004941', 'es runaba', '9152b28383e13e2a514302999ab43ed2.jpg', 1, 1, 'day', 'active', 1, '2026-10-27 13:27:03', '2026-10-29 06:03:54', '8e1f8c161a8152c5cd5cc403fe2d0e5f90d2e0a16de5e19c1eb44dbf521f0223'),
(5, 'STU-2026-0002', NULL, 'natukunda vvv', 'Male', '2026-10-07', 'kl', 'vv@gmail.com', '0783000000', 'man', 'cb30f2f53e86b7c03ceddd2d91a865c3.jpg', 2, 2, 'day', 'active', 7, '2026-10-27 14:39:13', '2026-10-29 06:03:04', '8d5ceb68ff42fefd1dbf0e9a0ae19f407108cd6e430129ff4f1bf977eaf8095e'),
(6, 'STU-2026-0003', NULL, 'vicky', 'Male', '2026-10-28', 'nyanza', 'vicky@gmail.com', '0784000000', 'nnn', '348fdf791428039da134d9f630fca641.jpg', 2, NULL, 'boarding', 'active', 1, '2026-10-27 16:00:23', '2026-10-28 08:45:39', 'c81f545cfe4ecf3953748cfe780a54d44ad3db5b1630a840fea380a3a734abe3'),
(7, 'STU-2026-0004', NULL, 'cyusa bright', 'Male', '2026-10-07', 'kgl', 'cyusabright49@gmail.com', '0793358571', 'bbbb', '9cc2289d6fa6f0634bd44bda311fa599.png', 2, 2, 'boarding', 'active', 1, '2026-10-28 03:54:13', '2026-10-28 08:47:04', 'cd3fbea4875a166f03e254bbd43144c995af25848b98736526d8eb7a61daf7be');

-- --------------------------------------------------------

--
-- Table structure for table `student_documents`
--

CREATE TABLE `student_documents` (
  `id` int(10) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL,
  `doc_type` varchar(60) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `student_parents`
--

CREATE TABLE `student_parents` (
  `student_id` int(10) UNSIGNED NOT NULL,
  `parent_id` int(10) UNSIGNED NOT NULL,
  `relationship` varchar(30) NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `student_parents`
--

INSERT INTO `student_parents` (`student_id`, `parent_id`, `relationship`, `is_primary`) VALUES
(4, 4, 'Guardian', 1),
(5, 5, 'Guardian', 1),
(6, 6, 'Guardian', 1),
(7, 7, 'Guardian', 1);

-- --------------------------------------------------------

--
-- Table structure for table `student_requirements`
--

CREATE TABLE `student_requirements` (
  `id` int(10) UNSIGNED NOT NULL,
  `registration_id` int(10) UNSIGNED NOT NULL,
  `requirement_id` int(10) UNSIGNED NOT NULL,
  `status` enum('pending','complete') NOT NULL DEFAULT 'pending',
  `checked_by` int(10) UNSIGNED DEFAULT NULL,
  `checked_at` datetime DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `student_requirements`
--

INSERT INTO `student_requirements` (`id`, `registration_id`, `requirement_id`, `status`, `checked_by`, `checked_at`, `note`) VALUES
(1, 1, 1, 'complete', 1, '2026-10-27 16:13:49', NULL),
(2, 1, 2, 'complete', 1, '2026-10-27 16:13:47', NULL),
(3, 1, 3, 'complete', 1, '2026-10-27 16:13:46', NULL),
(4, 2, 1, 'pending', NULL, NULL, NULL),
(5, 2, 2, 'complete', 1, '2026-10-27 17:58:52', NULL),
(6, 2, 3, 'pending', NULL, NULL, NULL),
(7, 3, 1, 'pending', NULL, NULL, NULL),
(8, 3, 2, 'pending', NULL, NULL, NULL),
(9, 3, 3, 'pending', NULL, NULL, NULL),
(10, 3, 4, 'pending', NULL, NULL, NULL),
(11, 4, 1, 'complete', 1, '2026-10-28 05:55:00', NULL),
(12, 4, 2, 'complete', 1, '2026-10-28 05:54:58', NULL),
(13, 4, 3, 'complete', 1, '2026-10-28 05:54:56', NULL),
(14, 4, 4, 'complete', 1, '2026-10-28 05:55:04', NULL),
(15, 4, 5, 'complete', 1, '2026-10-28 05:55:01', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `terms`
--

CREATE TABLE `terms` (
  `id` smallint(5) UNSIGNED NOT NULL,
  `academic_year_id` smallint(5) UNSIGNED NOT NULL,
  `name` varchar(30) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_current` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `terms`
--

INSERT INTO `terms` (`id`, `academic_year_id`, `name`, `start_date`, `end_date`, `is_current`) VALUES
(1, 1, 'term 2', '2026-10-28', '2026-10-28', 0),
(3, 1, 'term 3', '2026-10-28', '2026-10-28', 1),
(4, 9, 'term1', '2027-01-01', '2027-04-28', 0);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `role_id` tinyint(3) UNSIGNED NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `username` varchar(60) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_login_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `role_id`, `full_name`, `email`, `phone`, `username`, `password_hash`, `is_active`, `last_login_at`, `created_at`, `updated_at`) VALUES
(1, 1, 'Super Administrator', NULL, NULL, 'admin', '$2a$10$Fk3ycPYW5sfovJlUQ5etHukDxb1MjOpt9tWr6lLDyLnk61UdXNpq6', 1, '2026-10-29 11:57:08', '2026-10-27 10:41:25', '2026-10-29 09:57:08'),
(6, 4, 'Natakunda Vincent', 'natakundavincent@gmail.com', '0783004941', 'natakunda.vincent530', '$2a$10$g8NVtUMGaTilqz7tvOqgTetwjhMW0G6K2x6xFNulTJLtW1SURONHu', 1, '2026-10-27 18:21:41', '2026-10-27 13:29:39', '2026-10-27 16:21:41'),
(7, 2, 'mmm', 'natakundavincent1@gmail.com', '0783004945', 'mmm', '$2a$10$8/XItHgnbuJ4rhLzMPSEXuhIULKk7HVhvm.iVtyvUd58uJ0wyRXh.', 1, '2026-10-27 16:22:41', '2026-10-27 14:22:02', '2026-10-27 14:22:41'),
(8, 11, 'bill', 'bill@gmail.com', '07800000000', 'bill', '$2a$10$b5ruewlmlBzKAlY5iRIpJ.Ep3Vhfw9Ye2YxcVEQ/P3uA.CUZV.mau', 1, '2026-10-28 07:00:49', '2026-10-27 16:06:05', '2026-10-28 05:00:49'),
(9, 3, 'teacher', 'teacher@gmail.com', '0792000000', 'teacher', '$2a$10$jn3bhw1bRoPB87qymXgux.S/qExANLVCem3t4a0kI.ns7lukeT1Z2', 1, '2026-10-28 15:12:57', '2026-10-28 13:12:35', '2026-10-28 13:12:57');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `academic_years`
--
ALTER TABLE `academic_years`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `account_verifications`
--
ALTER TABLE `account_verifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`);

--
-- Indexes for table `arrivals`
--
ALTER TABLE `arrivals`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `registration_id` (`registration_id`),
  ADD UNIQUE KEY `term_id` (`term_id`,`bed_id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `bed_id` (`bed_id`),
  ADD KEY `table_id` (`table_id`),
  ADD KEY `recorded_by` (`recorded_by`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_audit_entity` (`entity`,`entity_id`);

--
-- Indexes for table `beds`
--
ALTER TABLE `beds`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `dormitory_id` (`dormitory_id`,`bed_number`,`position`);

--
-- Indexes for table `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `combinations`
--
ALTER TABLE `combinations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `dormitories`
--
ALTER TABLE `dormitories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `import_batches`
--
ALTER TABLE `import_batches`
  ADD PRIMARY KEY (`id`),
  ADD KEY `uploaded_by` (`uploaded_by`);

--
-- Indexes for table `parents`
--
ALTER TABLE `parents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `permission_cards`
--
ALTER TABLE `permission_cards`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permission_request_id` (`permission_request_id`),
  ADD UNIQUE KEY `permission_number` (`permission_number`),
  ADD UNIQUE KEY `verification_token` (`verification_token`),
  ADD KEY `issued_by` (`issued_by`);

--
-- Indexes for table `permission_requests`
--
ALTER TABLE `permission_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `reviewed_by` (`reviewed_by`),
  ADD KEY `idx_perm_status` (`status`),
  ADD KEY `fk_perm_dean` (`dean_id`);

--
-- Indexes for table `permission_scans`
--
ALTER TABLE `permission_scans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `card_id` (`card_id`),
  ADD KEY `scanned_by` (`scanned_by`);

--
-- Indexes for table `refectory_tables`
--
ALTER TABLE `refectory_tables`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `number` (`number`);

--
-- Indexes for table `registrations`
--
ALTER TABLE `registrations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `student_id` (`student_id`,`term_id`),
  ADD KEY `academic_year_id` (`academic_year_id`),
  ADD KEY `term_id` (`term_id`),
  ADD KEY `class_id` (`class_id`),
  ADD KEY `combination_id` (`combination_id`),
  ADD KEY `reviewed_by` (`reviewed_by`);

--
-- Indexes for table `requirements`
--
ALTER TABLE `requirements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `term_id` (`term_id`),
  ADD KEY `class_id` (`class_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`setting_key`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `student_code` (`student_code`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `qr_token` (`qr_token`),
  ADD KEY `current_class_id` (`current_class_id`),
  ADD KEY `current_combination_id` (`current_combination_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_students_name` (`full_name`);

--
-- Indexes for table `student_documents`
--
ALTER TABLE `student_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`);

--
-- Indexes for table `student_parents`
--
ALTER TABLE `student_parents`
  ADD PRIMARY KEY (`student_id`,`parent_id`),
  ADD KEY `parent_id` (`parent_id`);

--
-- Indexes for table `student_requirements`
--
ALTER TABLE `student_requirements`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `registration_id` (`registration_id`,`requirement_id`),
  ADD KEY `requirement_id` (`requirement_id`),
  ADD KEY `checked_by` (`checked_by`);

--
-- Indexes for table `terms`
--
ALTER TABLE `terms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `academic_year_id` (`academic_year_id`,`name`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `role_id` (`role_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `academic_years`
--
ALTER TABLE `academic_years`
  MODIFY `id` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `account_verifications`
--
ALTER TABLE `account_verifications`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `arrivals`
--
ALTER TABLE `arrivals`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=120;

--
-- AUTO_INCREMENT for table `beds`
--
ALTER TABLE `beds`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=275;

--
-- AUTO_INCREMENT for table `classes`
--
ALTER TABLE `classes`
  MODIFY `id` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `combinations`
--
ALTER TABLE `combinations`
  MODIFY `id` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `dormitories`
--
ALTER TABLE `dormitories`
  MODIFY `id` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `import_batches`
--
ALTER TABLE `import_batches`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `parents`
--
ALTER TABLE `parents`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `permission_cards`
--
ALTER TABLE `permission_cards`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `permission_requests`
--
ALTER TABLE `permission_requests`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `permission_scans`
--
ALTER TABLE `permission_scans`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `refectory_tables`
--
ALTER TABLE `refectory_tables`
  MODIFY `id` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=301;

--
-- AUTO_INCREMENT for table `registrations`
--
ALTER TABLE `registrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `requirements`
--
ALTER TABLE `requirements`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` tinyint(3) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `student_documents`
--
ALTER TABLE `student_documents`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `student_requirements`
--
ALTER TABLE `student_requirements`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `terms`
--
ALTER TABLE `terms`
  MODIFY `id` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `account_verifications`
--
ALTER TABLE `account_verifications`
  ADD CONSTRAINT `account_verifications_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `arrivals`
--
ALTER TABLE `arrivals`
  ADD CONSTRAINT `arrivals_ibfk_1` FOREIGN KEY (`registration_id`) REFERENCES `registrations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `arrivals_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `arrivals_ibfk_3` FOREIGN KEY (`term_id`) REFERENCES `terms` (`id`),
  ADD CONSTRAINT `arrivals_ibfk_4` FOREIGN KEY (`bed_id`) REFERENCES `beds` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `arrivals_ibfk_5` FOREIGN KEY (`table_id`) REFERENCES `refectory_tables` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `arrivals_ibfk_6` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `beds`
--
ALTER TABLE `beds`
  ADD CONSTRAINT `beds_ibfk_1` FOREIGN KEY (`dormitory_id`) REFERENCES `dormitories` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `import_batches`
--
ALTER TABLE `import_batches`
  ADD CONSTRAINT `import_batches_ibfk_1` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `parents`
--
ALTER TABLE `parents`
  ADD CONSTRAINT `parents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `permission_cards`
--
ALTER TABLE `permission_cards`
  ADD CONSTRAINT `permission_cards_ibfk_1` FOREIGN KEY (`permission_request_id`) REFERENCES `permission_requests` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `permission_cards_ibfk_2` FOREIGN KEY (`issued_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `permission_requests`
--
ALTER TABLE `permission_requests`
  ADD CONSTRAINT `fk_perm_dean` FOREIGN KEY (`dean_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `permission_requests_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `permission_requests_ibfk_2` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `permission_scans`
--
ALTER TABLE `permission_scans`
  ADD CONSTRAINT `permission_scans_ibfk_1` FOREIGN KEY (`card_id`) REFERENCES `permission_cards` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `permission_scans_ibfk_2` FOREIGN KEY (`scanned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `registrations`
--
ALTER TABLE `registrations`
  ADD CONSTRAINT `registrations_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `registrations_ibfk_2` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`),
  ADD CONSTRAINT `registrations_ibfk_3` FOREIGN KEY (`term_id`) REFERENCES `terms` (`id`),
  ADD CONSTRAINT `registrations_ibfk_4` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`),
  ADD CONSTRAINT `registrations_ibfk_5` FOREIGN KEY (`combination_id`) REFERENCES `combinations` (`id`),
  ADD CONSTRAINT `registrations_ibfk_6` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `requirements`
--
ALTER TABLE `requirements`
  ADD CONSTRAINT `requirements_ibfk_1` FOREIGN KEY (`term_id`) REFERENCES `terms` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `requirements_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `students_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `students_ibfk_2` FOREIGN KEY (`current_class_id`) REFERENCES `classes` (`id`),
  ADD CONSTRAINT `students_ibfk_3` FOREIGN KEY (`current_combination_id`) REFERENCES `combinations` (`id`),
  ADD CONSTRAINT `students_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `student_documents`
--
ALTER TABLE `student_documents`
  ADD CONSTRAINT `student_documents_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `student_parents`
--
ALTER TABLE `student_parents`
  ADD CONSTRAINT `student_parents_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_parents_ibfk_2` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `student_requirements`
--
ALTER TABLE `student_requirements`
  ADD CONSTRAINT `student_requirements_ibfk_1` FOREIGN KEY (`registration_id`) REFERENCES `registrations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_requirements_ibfk_2` FOREIGN KEY (`requirement_id`) REFERENCES `requirements` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_requirements_ibfk_3` FOREIGN KEY (`checked_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `terms`
--
ALTER TABLE `terms`
  ADD CONSTRAINT `terms_ibfk_1` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
