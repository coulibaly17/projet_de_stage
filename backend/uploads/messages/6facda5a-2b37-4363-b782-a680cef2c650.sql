-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 25, 2025 at 02:22 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `plateforme_educative`
--

-- --------------------------------------------------------

--
-- Table structure for table `alembic_version`
--

CREATE TABLE `alembic_version` (
  `version_num` varchar(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `alembic_version`
--

INSERT INTO `alembic_version` (`version_num`) VALUES
('1e9215e2684d');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Mathématiques', 'Cours de mathématiques pour tous les niveaux', '2025-07-04 03:04:03', NULL),
(2, 'Informatique', 'Programmation, algorithmes et technologies de l\'information', '2025-07-04 03:04:03', NULL),
(3, 'Langues', 'Apprentissage de langues étrangères', '2025-07-04 03:04:03', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE `courses` (
  `id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `slug` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `short_description` varchar(255) DEFAULT NULL,
  `thumbnail_url` varchar(255) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
  `instructor_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `level` varchar(50) NOT NULL DEFAULT 'beginner'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `courses`
--

INSERT INTO `courses` (`id`, `title`, `slug`, `description`, `short_description`, `thumbnail_url`, `price`, `status`, `instructor_id`, `category_id`, `created_at`, `updated_at`, `level`) VALUES
(1, 'Algèbre linéaire pour débutants', 'algebre-lineaire-debutants', 'Ce cours vous initie aux concepts fondamentaux de l\'algèbre linéaire.', 'Introduction aux concepts de base de l\'algèbre linéaire', 'https://tse3.mm.bing.net/th/id/OIP.tcxGlt927peFShEO0FKTegHaEK?r=0&rs=1&pid=ImgDetMain&o=7&rm=3', 0.00, 'published', 3, 1, '2025-07-04 03:04:03', '2025-07-05 21:41:28', 'beginner'),
(2, 'Introduction à Python', 'introduction-python', 'Apprenez les bases de la programmation avec Python, un langage simple et puissant.', 'Les fondamentaux de Python pour débutants', 'https://i.ytimg.com/vi/2siy87b-2Uc/maxresdefault.jpg', 0.00, 'published', 3, 2, '2025-07-04 03:04:03', '2025-07-04 13:39:53', 'beginner'),
(3, 'Anglais pour débutants', 'anglais-debutants', 'Apprenez les bases de l\'anglais avec une méthode simple et efficace.', 'Les fondamentaux de l\'anglais pour communiquer facilement', 'https://th.bing.com/th/id/OIP.1kA76TBvq-6ZaQOCETQazAHaEK?w=306&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3', 19.99, 'published', 2, 3, '2025-07-04 03:04:03', '2025-07-04 13:40:29', 'beginner');

-- --------------------------------------------------------

--
-- Table structure for table `course_prerequisites`
--

CREATE TABLE `course_prerequisites` (
  `course_id` int(11) NOT NULL,
  `prerequisite_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_student`
--

CREATE TABLE `course_student` (
  `course_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `enrollment_date` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `course_student`
--

INSERT INTO `course_student` (`course_id`, `student_id`, `enrollment_date`) VALUES
(1, 4, '2025-07-04 03:04:03'),
(1, 5, '2025-07-04 03:04:03'),
(2, 5, '2025-07-04 03:04:03'),
(3, 5, '2025-07-04 03:04:03');

-- --------------------------------------------------------

--
-- Table structure for table `course_tags`
--

CREATE TABLE `course_tags` (
  `course_id` int(11) NOT NULL,
  `tag_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `course_tags`
--

INSERT INTO `course_tags` (`course_id`, `tag_id`) VALUES
(1, 1),
(1, 4),
(2, 1),
(2, 4),
(3, 1),
(3, 5);

-- --------------------------------------------------------

--
-- Table structure for table `discussions`
--

CREATE TABLE `discussions` (
  `id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `is_group` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `discussions`
--

INSERT INTO `discussions` (`id`, `title`, `created_at`, `updated_at`, `created_by`, `is_group`) VALUES
(1, 'Général', '2025-07-25 07:46:30', '2025-07-25 07:46:30', 1, 1),
(2, 'Discussion privée', '2025-07-25 07:46:30', '2025-07-25 07:46:30', 2, 0);

-- --------------------------------------------------------

--
-- Table structure for table `discussion_participants`
--

CREATE TABLE `discussion_participants` (
  `user_id` int(11) NOT NULL,
  `discussion_id` int(11) NOT NULL,
  `joined_at` datetime NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `discussion_participants`
--

INSERT INTO `discussion_participants` (`user_id`, `discussion_id`, `joined_at`, `is_active`) VALUES
(1, 1, '2025-07-25 07:46:30', 1),
(3, 1, '2025-07-25 07:46:30', 1),
(4, 1, '2025-07-25 07:46:30', 1),
(4, 2, '2025-07-25 07:46:30', 1),
(5, 2, '2025-07-25 07:46:30', 1);

-- --------------------------------------------------------

--
-- Table structure for table `lessons`
--

CREATE TABLE `lessons` (
  `id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `content` text DEFAULT NULL,
  `video_url` varchar(255) DEFAULT NULL,
  `duration` int(11) DEFAULT NULL COMMENT 'Durée en secondes',
  `order_index` int(11) NOT NULL DEFAULT 0,
  `is_free` tinyint(1) NOT NULL DEFAULT 0,
  `course_id` int(11) NOT NULL,
  `module_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `lessons`
--

INSERT INTO `lessons` (`id`, `title`, `description`, `content`, `video_url`, `duration`, `order_index`, `is_free`, `course_id`, `module_id`, `created_at`, `updated_at`) VALUES
(1, 'Leçon 1: Introduction', 'Description de la leçon 1 du module 1', '<h1>Contenu de la leçon 1</h1><p>Ceci est le contenu détaillé de la leçon...</p>', 'https://youtu.be/9lLwHZMyHiE', 2020, 1, 1, 1, 1, '2025-07-04 03:04:03', '2025-07-25 02:40:00'),
(2, 'Leçon 2: Exercices pratiques', 'Description de la leçon 2 du module 1', '<h1>Contenu de la leçon 2</h1><p>Ceci est le contenu détaillé de la leçon...</p>', 'https://youtu.be/9lLwHZMyHiE', 2231, 2, 0, 1, 1, '2025-07-04 03:04:03', '2025-07-25 02:40:05'),
(3, 'Leçon 1: Concepts clés', 'Description de la leçon 1 du module 2', '<h1>Contenu de la leçon 1</h1><p>Ceci est le contenu détaillé de la leçon...</p>', 'https://youtu.be/9lLwHZMyHiE', 1696, 1, 1, 1, 2, '2025-07-04 03:04:03', '2025-07-25 02:40:20'),
(4, 'Leçon 2: Introduction', 'Description de la leçon 2 du module 2', '<h1>Contenu de la leçon 2</h1><p>Ceci est le contenu détaillé de la leçon...</p>', 'https://www.bing.com/videos/riverview/relatedvideo?&q=cour+sur+linformatie+youtube&&mid=64E395CACF8CF7B2381864E395CACF8CF7B23818&&FORM=VRDGAR', 2492, 2, 0, 1, 2, '2025-07-04 03:04:03', '2025-07-04 16:04:11'),
(5, 'Leçon 3: Concepts clés', 'Description de la leçon 3 du module 2', '<h1>Contenu de la leçon 3</h1><p>Ceci est le contenu détaillé de la leçon...</p>', 'https://www.bing.com/videos/riverview/relatedvideo?&q=cour+sur+linformatie+youtube&&mid=64E395CACF8CF7B2381864E395CACF8CF7B23818&&FORM=VRDGAR', 3537, 3, 0, 1, 2, '2025-07-04 03:04:03', '2025-07-04 16:04:15'),
(6, 'Leçon 4: Concepts clés', 'Description de la leçon 4 du module 2', '<h1>Contenu de la leçon 4</h1><p>Ceci est le contenu détaillé de la leçon...</p>', 'https://www.bing.com/videos/riverview/relatedvideo?&q=cour+sur+linformatie+youtube&&mid=64E395CACF8CF7B2381864E395CACF8CF7B23818&&FORM=VRDGAR', 1337, 4, 0, 1, 2, '2025-07-04 03:04:03', '2025-07-04 16:04:19'),
(7, 'Leçon 1: Exercices pratiques', 'Description de la leçon 1 du module 1', '<h1>Contenu de la leçon 1</h1><p>Ceci est le contenu détaillé de la leçon...</p>', 'https://www.bing.com/videos/riverview/relatedvideo?&q=cour+sur+linformatie+youtube&&mid=64E395CACF8CF7B2381864E395CACF8CF7B23818&&FORM=VRDGAR', 1927, 1, 1, 2, 3, '2025-07-04 03:04:03', '2025-07-04 16:04:27'),
(8, 'Leçon 2: Introduction', 'Description de la leçon 2 du module 1', '<h1>Contenu de la leçon 2</h1><p>Ceci est le contenu détaillé de la leçon...</p>', 'https://www.bing.com/videos/riverview/relatedvideo?&q=cour+sur+linformatie+youtube&&mid=64E395CACF8CF7B2381864E395CACF8CF7B23818&&FORM=VRDGAR', 2215, 2, 0, 2, 3, '2025-07-04 03:04:03', '2025-07-04 16:04:31'),
(9, 'Leçon 1: Concepts clés', 'Description de la leçon 1 du module 2', '<h1>Contenu de la leçon 1</h1><p>Ceci est le contenu détaillé de la leçon...</p>', 'https://www.bing.com/videos/riverview/relatedvideo?&q=cour+sur+linformatie+youtube&&mid=64E395CACF8CF7B2381864E395CACF8CF7B23818&&FORM=VRDGAR', 2082, 1, 1, 2, 4, '2025-07-04 03:04:03', '2025-07-04 16:04:34'),
(10, 'Leçon 2: Exercices pratiques', 'Description de la leçon 2 du module 2', '<h1>Contenu de la leçon 2</h1><p>Ceci est le contenu détaillé de la leçon...</p>', 'https://www.bing.com/videos/riverview/relatedvideo?&q=cour+sur+linformatie+youtube&&mid=64E395CACF8CF7B2381864E395CACF8CF7B23818&&FORM=VRDGAR', 2042, 2, 0, 2, 4, '2025-07-04 03:04:03', '2025-07-04 16:04:46'),
(11, 'Leçon 3: Concepts clés', 'Description de la leçon 3 du module 2', '<h1>Contenu de la leçon 3</h1><p>Ceci est le contenu détaillé de la leçon...</p>', 'https://www.bing.com/videos/riverview/relatedvideo?&q=cour+sur+linformatie+youtube&&mid=64E395CACF8CF7B2381864E395CACF8CF7B23818&&FORM=VRDGAR', 979, 3, 0, 2, 4, '2025-07-04 03:04:03', '2025-07-04 16:04:41'),
(12, 'Leçon 1: Concepts clés', 'Description de la leçon 1 du module 3', '<h1>Contenu de la leçon 1</h1><p>Ceci est le contenu détaillé de la leçon...</p>', 'https://th.bing.com/th?&id=OVP.rlYllP4TuoU82kfWGdTYwgHgFo&w=320&h=179&c=7&pid=2.1&rs=1', 1894, 1, 1, 2, 5, '2025-07-04 03:04:03', '2025-07-04 16:02:27'),
(13, 'Leçon 2: Exercices pratiques', 'Description de la leçon 2 du module 3', '<h1>Contenu de la leçon 2</h1><p>Ceci est le contenu détaillé de la leçon...</p>', 'https://www.bing.com/videos/riverview/relatedvideo?&q=cour+sur+linformatie+youtube&&mid=64E395CACF8CF7B2381864E395CACF8CF7B23818&&FORM=VRDGAR', 929, 2, 0, 2, 5, '2025-07-04 03:04:03', '2025-07-04 16:03:47'),
(14, 'Leçon 1: Exercices pratiques', 'Description de la leçon 1 du module 1', '<h1>Contenu de la leçon 1</h1><p>Ceci est le contenu détaillé de la leçon...</p>', 'https://www.bing.com/videos/riverview/relatedvideo?&q=cour+sur+linformatie+youtube&&mid=64E395CACF8CF7B2381864E395CACF8CF7B23818&&FORM=VRDGAR', 1655, 1, 1, 3, 6, '2025-07-04 03:04:03', '2025-07-04 16:04:54'),
(15, 'Leçon 2: Exercices pratiques', 'Description de la leçon 2 du module 1', '<h1>Contenu de la leçon 2</h1><p>Ceci est le contenu détaillé de la leçon...</p>', 'https://th.bing.com/th?&id=OVP.rlYllP4TuoU82kfWGdTYwgHgFo&w=320&h=179&c=7&pid=2.1&rs=1', 2832, 2, 0, 3, 6, '2025-07-04 03:04:03', '2025-07-04 16:02:41'),
(16, 'Leçon 3: Concepts clés', 'Description de la leçon 3 du module 1', '<h1>Contenu de la leçon 3</h1><p>Ceci est le contenu détaillé de la leçon...</p>', 'https://th.bing.com/th?&id=OVP.rlYllP4TuoU82kfWGdTYwgHgFo&w=320&h=179&c=7&pid=2.1&rs=1', 2568, 3, 0, 3, 6, '2025-07-04 03:04:03', '2025-07-04 16:02:45'),
(17, 'Leçon 1: Exercices pratiques', 'Description de la leçon 1 du module 2', '<h1>Contenu de la leçon 1</h1><p>Ceci est le contenu détaillé de la leçon...</p>', 'https://th.bing.com/th?&id=OVP.rlYllP4TuoU82kfWGdTYwgHgFo&w=320&h=179&c=7&pid=2.1&rs=1', 2590, 1, 1, 3, 7, '2025-07-04 03:04:03', '2025-07-04 16:02:49'),
(18, 'Leçon 2: Exercices pratiques', 'Description de la leçon 2 du module 2', '<h1>Contenu de la leçon 2</h1><p>Ceci est le contenu détaillé de la leçon...</p>', 'https://th.bing.com/th?&id=OVP.rlYllP4TuoU82kfWGdTYwgHgFo&w=320&h=179&c=7&pid=2.1&rs=1', 3438, 2, 0, 3, 7, '2025-07-04 03:04:03', '2025-07-04 16:02:53');

-- --------------------------------------------------------

--
-- Table structure for table `lesson_completions`
--

CREATE TABLE `lesson_completions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `lesson_id` int(11) NOT NULL,
  `completed_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `lesson_completions`
--

INSERT INTO `lesson_completions` (`id`, `user_id`, `lesson_id`, `completed_at`) VALUES
(1, 4, 2, '2025-06-27 03:04:03'),
(2, 4, 6, '2025-06-22 03:04:03'),
(3, 5, 6, '2025-06-06 03:04:03'),
(4, 4, 7, '2025-06-21 03:04:03'),
(5, 4, 8, '2025-07-03 03:04:03'),
(6, 4, 9, '2025-06-22 03:04:03'),
(7, 4, 10, '2025-06-25 03:04:03'),
(8, 4, 11, '2025-06-14 03:04:03'),
(9, 5, 14, '2025-06-10 03:04:03'),
(10, 5, 15, '2025-06-12 03:04:03'),
(11, 5, 16, '2025-06-17 03:04:03'),
(12, 5, 17, '2025-06-19 03:04:03');

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `content` text NOT NULL,
  `sent_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `discussion_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `content`, `sent_at`, `updated_at`, `discussion_id`, `sender_id`, `is_deleted`) VALUES
(1, 'Bienvenue dans le groupe général !', '2025-07-25 07:46:30', '2025-07-25 07:46:30', 1, 1, 0),
(2, 'Merci, content d\'être là !', '2025-07-25 07:46:30', '2025-07-25 07:46:30', 1, 4, 0),
(3, 'Salut, comment ça va ?', '2025-07-25 07:46:30', '2025-07-25 07:46:30', 2, 1, 0),
(4, 'Ça va bien merci, et toi ?', '2025-07-25 07:46:30', '2025-07-25 07:46:30', 2, 2, 0);

-- --------------------------------------------------------

--
-- Table structure for table `message_reads`
--

CREATE TABLE `message_reads` (
  `id` int(11) NOT NULL,
  `message_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `read_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `modules`
--

CREATE TABLE `modules` (
  `id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `order_index` int(11) NOT NULL DEFAULT 0,
  `course_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `modules`
--

INSERT INTO `modules` (`id`, `title`, `description`, `order_index`, `course_id`, `created_at`, `updated_at`) VALUES
(1, 'Module 1: Concepts avancés', 'Description du module 1 pour le cours Algèbre linéaire pour débutants', 1, 1, '2025-07-04 03:04:03', NULL),
(2, 'Module 2: Concepts avancés', 'Description du module 2 pour le cours Algèbre linéaire pour débutants', 2, 1, '2025-07-04 03:04:03', NULL),
(3, 'Module 1: Applications pratiques', 'Description du module 1 pour le cours Introduction à Python', 1, 2, '2025-07-04 03:04:03', NULL),
(4, 'Module 2: Applications pratiques', 'Description du module 2 pour le cours Introduction à Python', 2, 2, '2025-07-04 03:04:03', NULL),
(5, 'Module 3: Applications pratiques', 'Description du module 3 pour le cours Introduction à Python', 3, 2, '2025-07-04 03:04:03', NULL),
(6, 'Module 1: Concepts avancés', 'Description du module 1 pour le cours Anglais pour débutants', 1, 3, '2025-07-04 03:04:03', NULL),
(7, 'Module 2: Concepts avancés', 'Description du module 2 pour le cours Anglais pour débutants', 2, 3, '2025-07-04 03:04:03', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `quizzes`
--

CREATE TABLE `quizzes` (
  `id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `lesson_id` int(11) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `passing_score` int(11) NOT NULL DEFAULT 70 COMMENT 'Score de passage en pourcentage',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `quizzes`
--

INSERT INTO `quizzes` (`id`, `title`, `description`, `lesson_id`, `is_active`, `passing_score`, `created_at`, `updated_at`) VALUES
(1, 'Quiz: Leçon 1: Concepts clés', 'Testez vos connaissances sur Leçon 1: Concepts clés', 3, 1, 70, '2025-07-04 03:04:03', NULL),
(2, 'Quiz: Leçon 2: Introduction', 'Testez vos connaissances sur Leçon 2: Introduction', 4, 1, 70, '2025-07-04 03:04:03', NULL),
(3, 'Quiz: Leçon 3: Concepts clés', 'Testez vos connaissances sur Leçon 3: Concepts clés', 5, 1, 70, '2025-07-04 03:04:03', NULL),
(4, 'Quiz: Leçon 4: Concepts clés', 'Testez vos connaissances sur Leçon 4: Concepts clés', 6, 1, 70, '2025-07-04 03:04:03', NULL),
(5, 'Quiz: Leçon 1: Exercices pratiques', 'Testez vos connaissances sur Leçon 1: Exercices pratiques', 7, 1, 70, '2025-07-04 03:04:03', NULL),
(6, 'Quiz: Leçon 2: Introduction', 'Testez vos connaissances sur Leçon 2: Introduction', 8, 1, 70, '2025-07-04 03:04:03', NULL),
(7, 'Quiz: Leçon 2: Exercices pratiques', 'Testez vos connaissances sur Leçon 2: Exercices pratiques', 10, 1, 70, '2025-07-04 03:04:03', NULL),
(8, 'Quiz: Leçon 3: Concepts clés', 'Testez vos connaissances sur Leçon 3: Concepts clés', 11, 1, 70, '2025-07-04 03:04:03', NULL),
(9, 'Quiz: Leçon 1: Concepts clés', 'Testez vos connaissances sur Leçon 1: Concepts clés', 12, 1, 70, '2025-07-04 03:04:03', NULL),
(10, 'Quiz: Leçon 2: Exercices pratiques', 'Testez vos connaissances sur Leçon 2: Exercices pratiques', 13, 1, 70, '2025-07-04 03:04:03', NULL),
(11, 'Quiz: Leçon 1: Exercices pratiques', 'Testez vos connaissances sur Leçon 1: Exercices pratiques', 14, 1, 70, '2025-07-04 03:04:03', NULL),
(12, 'Quiz: Leçon 2: Exercices pratiques', 'Testez vos connaissances sur Leçon 2: Exercices pratiques', 15, 1, 70, '2025-07-04 03:04:03', NULL),
(13, 'Quiz: Leçon 3: Concepts clés', 'Testez vos connaissances sur Leçon 3: Concepts clés', 16, 1, 70, '2025-07-04 03:04:03', NULL),
(14, 'Quiz: Leçon 1: Exercices pratiques', 'Testez vos connaissances sur Leçon 1: Exercices pratiques', 17, 1, 70, '2025-07-04 03:04:03', NULL),
(15, 'Quiz: Leçon 2: Exercices pratiques', 'Testez vos connaissances sur Leçon 2: Exercices pratiques', 18, 1, 70, '2025-07-04 03:04:03', NULL),
(16, 'poo', 'l\'herritage', 1, 0, 70, '2025-07-11 12:07:58', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `quiz_options`
--

CREATE TABLE `quiz_options` (
  `id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `option_text` text NOT NULL,
  `is_correct` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `quiz_options`
--

INSERT INTO `quiz_options` (`id`, `question_id`, `option_text`, `is_correct`) VALUES
(1, 1, 'montreal', 0),
(2, 1, 'canada', 1),
(3, 1, 'quebec', 0),
(4, 1, 'ottawa', 0),
(5, 2, 'php', 0),
(6, 2, 'python', 0),
(7, 2, 'IA intelligence artificiel', 0),
(8, 2, 'java', 1),
(9, 3, 'Option 1 pour la question 3', 0),
(10, 3, 'Option 2 pour la question 3', 1),
(11, 3, 'Option 3 pour la question 3', 0),
(12, 4, 'Option 1 pour la question 1', 1),
(13, 4, 'Option 2 pour la question 1', 0),
(14, 4, 'Option 3 pour la question 1', 0),
(15, 5, 'Option 1 pour la question 2', 1),
(16, 5, 'Option 2 pour la question 2', 0),
(17, 5, 'Option 3 pour la question 2', 0),
(18, 5, 'Option 4 pour la question 2', 0),
(19, 6, 'Option 1 pour la question 3', 0),
(20, 6, 'Option 2 pour la question 3', 1),
(21, 6, 'Option 3 pour la question 3', 0),
(22, 6, 'Option 4 pour la question 3', 0),
(23, 7, 'Option 1 pour la question 1', 1),
(24, 7, 'Option 2 pour la question 1', 0),
(25, 7, 'Option 3 pour la question 1', 0),
(26, 7, 'Option 4 pour la question 1', 0),
(27, 8, 'Option 1 pour la question 2', 1),
(28, 8, 'Option 2 pour la question 2', 0),
(29, 8, 'Option 3 pour la question 2', 0),
(30, 8, 'Option 4 pour la question 2', 0),
(31, 9, 'Option 1 pour la question 3', 0),
(32, 9, 'Option 2 pour la question 3', 0),
(33, 9, 'Option 3 pour la question 3', 1),
(34, 10, 'Option 1 pour la question 4', 0),
(35, 10, 'Option 2 pour la question 4', 1),
(36, 10, 'Option 3 pour la question 4', 0),
(37, 10, 'Option 4 pour la question 4', 0),
(38, 11, 'Option 1 pour la question 1', 0),
(39, 11, 'Option 2 pour la question 1', 0),
(40, 11, 'Option 3 pour la question 1', 1),
(41, 11, 'Option 4 pour la question 1', 0),
(42, 12, 'Option 1 pour la question 2', 0),
(43, 12, 'Option 2 pour la question 2', 1),
(44, 12, 'Option 3 pour la question 2', 0),
(45, 12, 'Option 4 pour la question 2', 0),
(46, 13, 'Option 1 pour la question 3', 0),
(47, 13, 'Option 2 pour la question 3', 0),
(48, 13, 'Option 3 pour la question 3', 1),
(49, 13, 'Option 4 pour la question 3', 0),
(50, 14, 'Option 1 pour la question 4', 1),
(51, 14, 'Option 2 pour la question 4', 0),
(52, 14, 'Option 3 pour la question 4', 0),
(53, 15, 'Option 1 pour la question 1', 1),
(54, 15, 'Option 2 pour la question 1', 0),
(55, 15, 'Option 3 pour la question 1', 0),
(56, 16, 'Option 1 pour la question 2', 0),
(57, 16, 'Option 2 pour la question 2', 0),
(58, 16, 'Option 3 pour la question 2', 1),
(59, 16, 'Option 4 pour la question 2', 0),
(60, 17, 'Option 1 pour la question 3', 0),
(61, 17, 'Option 2 pour la question 3', 0),
(62, 17, 'Option 3 pour la question 3', 1),
(63, 18, 'Option 1 pour la question 4', 0),
(64, 18, 'Option 2 pour la question 4', 0),
(65, 18, 'Option 3 pour la question 4', 1),
(66, 19, 'Option 1 pour la question 5', 0),
(67, 19, 'Option 2 pour la question 5', 1),
(68, 19, 'Option 3 pour la question 5', 0),
(69, 19, 'Option 4 pour la question 5', 0),
(70, 20, 'Option 1 pour la question 1', 0),
(71, 20, 'Option 2 pour la question 1', 0),
(72, 20, 'Option 3 pour la question 1', 0),
(73, 20, 'Option 4 pour la question 1', 1),
(74, 21, 'Option 1 pour la question 2', 1),
(75, 21, 'Option 2 pour la question 2', 0),
(76, 21, 'Option 3 pour la question 2', 0),
(77, 21, 'Option 4 pour la question 2', 0),
(78, 22, 'Option 1 pour la question 3', 0),
(79, 22, 'Option 2 pour la question 3', 1),
(80, 22, 'Option 3 pour la question 3', 0),
(81, 22, 'Option 4 pour la question 3', 0),
(82, 23, 'Option 1 pour la question 4', 0),
(83, 23, 'Option 2 pour la question 4', 0),
(84, 23, 'Option 3 pour la question 4', 0),
(85, 23, 'Option 4 pour la question 4', 1),
(86, 24, 'Option 1 pour la question 5', 1),
(87, 24, 'Option 2 pour la question 5', 0),
(88, 24, 'Option 3 pour la question 5', 0),
(89, 24, 'Option 4 pour la question 5', 0),
(90, 25, 'Option 1 pour la question 1', 1),
(91, 25, 'Option 2 pour la question 1', 0),
(92, 25, 'Option 3 pour la question 1', 0),
(93, 26, 'Option 1 pour la question 2', 0),
(94, 26, 'Option 2 pour la question 2', 0),
(95, 26, 'Option 3 pour la question 2', 1),
(96, 26, 'Option 4 pour la question 2', 0),
(97, 27, 'Option 1 pour la question 3', 1),
(98, 27, 'Option 2 pour la question 3', 0),
(99, 27, 'Option 3 pour la question 3', 0),
(100, 27, 'Option 4 pour la question 3', 0),
(101, 28, 'Option 1 pour la question 4', 1),
(102, 28, 'Option 2 pour la question 4', 0),
(103, 28, 'Option 3 pour la question 4', 0),
(104, 28, 'Option 4 pour la question 4', 0),
(105, 29, 'Option 1 pour la question 5', 0),
(106, 29, 'Option 2 pour la question 5', 1),
(107, 29, 'Option 3 pour la question 5', 0),
(108, 30, 'Option 1 pour la question 1', 1),
(109, 30, 'Option 2 pour la question 1', 0),
(110, 30, 'Option 3 pour la question 1', 0),
(111, 30, 'Option 4 pour la question 1', 0),
(112, 31, 'Option 1 pour la question 2', 0),
(113, 31, 'Option 2 pour la question 2', 0),
(114, 31, 'Option 3 pour la question 2', 1),
(115, 31, 'Option 4 pour la question 2', 0),
(116, 32, 'Option 1 pour la question 3', 0),
(117, 32, 'Option 2 pour la question 3', 0),
(118, 32, 'Option 3 pour la question 3', 1),
(119, 33, 'Option 1 pour la question 4', 0),
(120, 33, 'Option 2 pour la question 4', 0),
(121, 33, 'Option 3 pour la question 4', 1),
(122, 33, 'Option 4 pour la question 4', 0),
(123, 34, 'Option 1 pour la question 1', 0),
(124, 34, 'Option 2 pour la question 1', 0),
(125, 34, 'Option 3 pour la question 1', 0),
(126, 34, 'Option 4 pour la question 1', 1),
(127, 35, 'Option 1 pour la question 2', 0),
(128, 35, 'Option 2 pour la question 2', 0),
(129, 35, 'Option 3 pour la question 2', 1),
(130, 36, 'Option 1 pour la question 3', 1),
(131, 36, 'Option 2 pour la question 3', 0),
(132, 36, 'Option 3 pour la question 3', 0),
(133, 37, 'Option 1 pour la question 4', 0),
(134, 37, 'Option 2 pour la question 4', 0),
(135, 37, 'Option 3 pour la question 4', 0),
(136, 37, 'Option 4 pour la question 4', 1),
(137, 38, 'Option 1 pour la question 5', 0),
(138, 38, 'Option 2 pour la question 5', 0),
(139, 38, 'Option 3 pour la question 5', 0),
(140, 38, 'Option 4 pour la question 5', 1),
(141, 39, 'Option 1 pour la question 1', 0),
(142, 39, 'Option 2 pour la question 1', 1),
(143, 39, 'Option 3 pour la question 1', 0),
(144, 40, 'Option 1 pour la question 2', 0),
(145, 40, 'Option 2 pour la question 2', 0),
(146, 40, 'Option 3 pour la question 2', 0),
(147, 40, 'Option 4 pour la question 2', 1),
(148, 41, 'Option 1 pour la question 3', 0),
(149, 41, 'Option 2 pour la question 3', 0),
(150, 41, 'Option 3 pour la question 3', 0),
(151, 41, 'Option 4 pour la question 3', 1),
(152, 42, 'Option 1 pour la question 4', 1),
(153, 42, 'Option 2 pour la question 4', 0),
(154, 42, 'Option 3 pour la question 4', 0),
(155, 42, 'Option 4 pour la question 4', 0),
(156, 43, 'Option 1 pour la question 1', 0),
(157, 43, 'Option 2 pour la question 1', 1),
(158, 43, 'Option 3 pour la question 1', 0),
(159, 44, 'Option 1 pour la question 2', 0),
(160, 44, 'Option 2 pour la question 2', 0),
(161, 44, 'Option 3 pour la question 2', 0),
(162, 44, 'Option 4 pour la question 2', 1),
(163, 45, 'Option 1 pour la question 3', 1),
(164, 45, 'Option 2 pour la question 3', 0),
(165, 45, 'Option 3 pour la question 3', 0),
(166, 45, 'Option 4 pour la question 3', 0),
(167, 46, 'Option 1 pour la question 1', 0),
(168, 46, 'Option 2 pour la question 1', 1),
(169, 46, 'Option 3 pour la question 1', 0),
(170, 47, 'Option 1 pour la question 2', 0),
(171, 47, 'Option 2 pour la question 2', 0),
(172, 47, 'Option 3 pour la question 2', 0),
(173, 47, 'Option 4 pour la question 2', 1),
(174, 48, 'Option 1 pour la question 3', 0),
(175, 48, 'Option 2 pour la question 3', 1),
(176, 48, 'Option 3 pour la question 3', 0),
(177, 48, 'Option 4 pour la question 3', 0),
(178, 49, 'Option 1 pour la question 1', 1),
(179, 49, 'Option 2 pour la question 1', 0),
(180, 49, 'Option 3 pour la question 1', 0),
(181, 49, 'Option 4 pour la question 1', 0),
(182, 50, 'Option 1 pour la question 2', 1),
(183, 50, 'Option 2 pour la question 2', 0),
(184, 50, 'Option 3 pour la question 2', 0),
(185, 51, 'Option 1 pour la question 3', 0),
(186, 51, 'Option 2 pour la question 3', 0),
(187, 51, 'Option 3 pour la question 3', 1),
(188, 52, 'Option 1 pour la question 4', 0),
(189, 52, 'Option 2 pour la question 4', 0),
(190, 52, 'Option 3 pour la question 4', 1),
(191, 53, 'Option 1 pour la question 5', 1),
(192, 53, 'Option 2 pour la question 5', 0),
(193, 53, 'Option 3 pour la question 5', 0),
(194, 54, 'Option 1 pour la question 1', 1),
(195, 54, 'Option 2 pour la question 1', 0),
(196, 54, 'Option 3 pour la question 1', 0),
(197, 55, 'Option 1 pour la question 2', 1),
(198, 55, 'Option 2 pour la question 2', 0),
(199, 55, 'Option 3 pour la question 2', 0),
(200, 56, 'Option 1 pour la question 3', 0),
(201, 56, 'Option 2 pour la question 3', 0),
(202, 56, 'Option 3 pour la question 3', 1),
(203, 57, 'Option 1 pour la question 4', 0),
(204, 57, 'Option 2 pour la question 4', 0),
(205, 57, 'Option 3 pour la question 4', 1),
(206, 57, 'Option 4 pour la question 4', 0),
(207, 58, 'Option 1 pour la question 5', 0),
(208, 58, 'Option 2 pour la question 5', 1),
(209, 58, 'Option 3 pour la question 5', 0),
(210, 58, 'Option 4 pour la question 5', 0),
(211, 59, 'Option 1 pour la question 1', 0),
(212, 59, 'Option 2 pour la question 1', 0),
(213, 59, 'Option 3 pour la question 1', 0),
(214, 59, 'Option 4 pour la question 1', 1),
(215, 60, 'Option 1 pour la question 2', 0),
(216, 60, 'Option 2 pour la question 2', 0),
(217, 60, 'Option 3 pour la question 2', 1),
(218, 61, 'Option 1 pour la question 3', 1),
(219, 61, 'Option 2 pour la question 3', 0),
(220, 61, 'Option 3 pour la question 3', 0),
(221, 62, 'zrxdtcfyvgubhinjomkp', 1),
(222, 62, 'xrdtcfyvgubhinjmlk;,lè', 0);

-- --------------------------------------------------------

--
-- Table structure for table `quiz_questions`
--

CREATE TABLE `quiz_questions` (
  `id` int(11) NOT NULL,
  `quiz_id` int(11) NOT NULL,
  `question_text` text NOT NULL,
  `question_type` varchar(50) NOT NULL COMMENT 'multiple_choice, true_false, short_answer',
  `points` int(11) NOT NULL DEFAULT 1,
  `order_index` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `quiz_questions`
--

INSERT INTO `quiz_questions` (`id`, `quiz_id`, `question_text`, `question_type`, `points`, `order_index`) VALUES
(1, 1, 'Question 1: quel est la capitale du canada?', 'multiple_choice', 1, 1),
(2, 1, 'Question 2: quel cour monsieur styve donne ?', 'multiple_choice', 1, 2),
(3, 1, 'Question 3: peut on utiliser plusieur langage de programation?', 'multiple_choice', 1, 3),
(4, 2, 'Question 1: qui est l\'homme le plus riche du monde?', 'multiple_choice', 1, 1),
(5, 2, 'Question 2: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 2),
(6, 2, 'Question 3: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 3),
(7, 3, 'Question 1: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 1),
(8, 3, 'Question 2: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 2),
(9, 3, 'Question 3: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 3),
(10, 3, 'Question 4: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 4),
(11, 4, 'Question 1: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 1),
(12, 4, 'Question 2: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 2),
(13, 4, 'Question 3: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 3),
(14, 4, 'Question 4: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 4),
(15, 5, 'Question 1: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 1),
(16, 5, 'Question 2: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 2),
(17, 5, 'Question 3: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 3),
(18, 5, 'Question 4: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 4),
(19, 5, 'Question 5: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 5),
(20, 6, 'Question 1: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 1),
(21, 6, 'Question 2: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 2),
(22, 6, 'Question 3: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 3),
(23, 6, 'Question 4: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 4),
(24, 6, 'Question 5: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 5),
(25, 7, 'Question 1: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 1),
(26, 7, 'Question 2: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 2),
(27, 7, 'Question 3: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 3),
(28, 7, 'Question 4: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 4),
(29, 7, 'Question 5: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 5),
(30, 8, 'Question 1: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 1),
(31, 8, 'Question 2: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 2),
(32, 8, 'Question 3: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 3),
(33, 8, 'Question 4: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 4),
(34, 9, 'Question 1: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 1),
(35, 9, 'Question 2: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 2),
(36, 9, 'Question 3: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 3),
(37, 9, 'Question 4: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 4),
(38, 9, 'Question 5: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 5),
(39, 10, 'Question 1: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 1),
(40, 10, 'Question 2: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 2),
(41, 10, 'Question 3: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 3),
(42, 10, 'Question 4: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 4),
(43, 11, 'Question 1: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 1),
(44, 11, 'Question 2: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 2),
(45, 11, 'Question 3: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 3),
(46, 12, 'Question 1: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 1),
(47, 12, 'Question 2: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 2),
(48, 12, 'Question 3: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 3),
(49, 13, 'Question 1: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 1),
(50, 13, 'Question 2: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 2),
(51, 13, 'Question 3: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 3),
(52, 13, 'Question 4: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 4),
(53, 13, 'Question 5: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 5),
(54, 14, 'Question 1: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 1),
(55, 14, 'Question 2: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 2),
(56, 14, 'Question 3: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 3),
(57, 14, 'Question 4: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 4),
(58, 14, 'Question 5: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 5),
(59, 15, 'Question 1: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 1),
(60, 15, 'Question 2: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 2),
(61, 15, 'Question 3: Lorem ipsum dolor sit amet?', 'multiple_choice', 1, 3),
(62, 16, 'c\'est quoi l\'heritage', 'single', 1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `resources`
--

CREATE TABLE `resources` (
  `id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `url` varchar(255) NOT NULL,
  `type` varchar(50) NOT NULL COMMENT 'pdf, doc, video, etc.',
  `lesson_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `resources`
--

INSERT INTO `resources` (`id`, `title`, `url`, `type`, `lesson_id`, `created_at`) VALUES
(1, 'Support de cours - Leçon 1', 'https://example.com/resources/course1_module1_lesson1.pdf', 'pdf', 1, '2025-07-04 03:04:03'),
(2, 'Support de cours - Leçon 2', 'https://example.com/resources/course1_module1_lesson2.pdf', 'pdf', 2, '2025-07-04 03:04:03'),
(3, 'Support de cours - Leçon 1', 'https://example.com/resources/course1_module2_lesson1.pdf', 'pdf', 3, '2025-07-04 03:04:03'),
(4, 'Support de cours - Leçon 2', 'https://example.com/resources/course1_module2_lesson2.pdf', 'pdf', 4, '2025-07-04 03:04:03'),
(5, 'Support de cours - Leçon 3', 'https://example.com/resources/course1_module2_lesson3.pdf', 'pdf', 5, '2025-07-04 03:04:03'),
(6, 'Support de cours - Leçon 4', 'https://example.com/resources/course1_module2_lesson4.pdf', 'pdf', 6, '2025-07-04 03:04:03'),
(7, 'Support de cours - Leçon 1', 'https://example.com/resources/course2_module1_lesson1.pdf', 'pdf', 7, '2025-07-04 03:04:03'),
(8, 'Support de cours - Leçon 2', 'https://example.com/resources/course2_module1_lesson2.pdf', 'pdf', 8, '2025-07-04 03:04:03'),
(9, 'Support de cours - Leçon 1', 'https://example.com/resources/course2_module2_lesson1.pdf', 'pdf', 9, '2025-07-04 03:04:03'),
(10, 'Support de cours - Leçon 2', 'https://example.com/resources/course2_module2_lesson2.pdf', 'pdf', 10, '2025-07-04 03:04:03'),
(11, 'Support de cours - Leçon 3', 'https://example.com/resources/course2_module2_lesson3.pdf', 'pdf', 11, '2025-07-04 03:04:03'),
(12, 'Support de cours - Leçon 1', 'https://example.com/resources/course2_module3_lesson1.pdf', 'pdf', 12, '2025-07-04 03:04:03'),
(13, 'Support de cours - Leçon 2', 'https://example.com/resources/course2_module3_lesson2.pdf', 'pdf', 13, '2025-07-04 03:04:03'),
(14, 'Support de cours - Leçon 1', 'https://example.com/resources/course3_module1_lesson1.pdf', 'pdf', 14, '2025-07-04 03:04:03'),
(15, 'Support de cours - Leçon 2', 'https://example.com/resources/course3_module1_lesson2.pdf', 'pdf', 15, '2025-07-04 03:04:03'),
(16, 'Support de cours - Leçon 3', 'https://example.com/resources/course3_module1_lesson3.pdf', 'pdf', 16, '2025-07-04 03:04:03'),
(17, 'Support de cours - Leçon 1', 'https://example.com/resources/course3_module2_lesson1.pdf', 'pdf', 17, '2025-07-04 03:04:03'),
(18, 'Support de cours - Leçon 2', 'https://example.com/resources/course3_module2_lesson2.pdf', 'pdf', 18, '2025-07-04 03:04:03');

-- --------------------------------------------------------

--
-- Table structure for table `tags`
--

CREATE TABLE `tags` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tags`
--

INSERT INTO `tags` (`id`, `name`, `created_at`) VALUES
(1, 'débutant', '2025-07-04 03:04:03'),
(2, 'intermédiaire', '2025-07-04 03:04:03'),
(3, 'avancé', '2025-07-04 03:04:03'),
(4, 'gratuit', '2025-07-04 03:04:03'),
(5, 'premium', '2025-07-04 03:04:03');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `role` enum('etudiant','enseignant','admin') NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `first_name`, `last_name`, `role`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'admin@example.com', '$2b$12$hca6SxaVLPt7WO9sBSOGOe2pWKi5kxAjAHXqEm0pzNXU.MMW0hcPO', 'Admin', 'Système', 'admin', 1, '2025-07-04 03:04:03', '2025-07-04 03:10:17'),
(2, 'prof_math', 'prof.math@example.com', '$2b$12$8Et1f39fD6cObjWR9kw5CuEiIVq4BSs1xtuNTG8zx.GvPRqVd0J56', 'Marie', 'Dubois', 'enseignant', 1, '2025-07-04 03:04:03', '2025-07-04 03:10:18'),
(3, 'prof_info', 'prof.info@example.com', '$2b$12$TdYKVMBzjHQV.4ieW4HgxecPEzjMYrFZxjWFLjqSIHjWQbF6P3oZK', 'Pierre', 'Martin', 'enseignant', 1, '2025-07-04 03:04:03', '2025-07-04 03:10:18'),
(4, 'etudiant1', 'etudiant1@example.com', '$2b$12$fqsi3k7g82syJg73ylY7YuNL2AuA.blTZRVT2wRp4TgB04f34/tOO', 'Jean', 'Dupont', 'etudiant', 1, '2025-07-04 03:04:03', '2025-07-04 03:10:17'),
(5, 'etudiant2', 'etudiant2@example.com', '$2b$12$29uAty5m/9Ars1ovlBF3t.piL.b8NCfUMdsjtqiT.mC2YWrFRlvdq', 'Lucie', 'Bernard', 'etudiant', 1, '2025-07-04 03:04:03', '2025-07-04 03:10:18'),
(6, 'coulibaly', 'coulibaly@gmail.com', '$2b$12$iBZwThjM9yrK9QGocCM8me27iV9B3dSbYdPZ8pR6Mg2pBDrS1QfyS', 'Abdoulaye', 'Coulibaly', 'etudiant', 1, '2025-07-10 22:58:30', NULL),
(7, 'newton', 'newton@gmail.com', '$2b$12$1BKPyERuNWKmpee6taj35u4u5N2q4jL4OLKROjsNdfJEz65bCEyIy', 'isaac', 'newton', 'enseignant', 1, '2025-07-10 23:26:44', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_interactions`
--

CREATE TABLE `user_interactions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL COMMENT 'ID de l''utilisateur qui a effectué l''interaction',
  `entity_type` varchar(50) NOT NULL COMMENT 'Type d''entité (course, lesson, quiz, etc.)',
  `entity_id` int(11) NOT NULL COMMENT 'ID de l''entité avec laquelle l''utilisateur a interagi',
  `interaction_type` varchar(50) NOT NULL COMMENT 'Type d''interaction (view, click, complete, rate, etc.)',
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Métadonnées supplémentaires sur l''interaction (contexte, durée, etc.)' CHECK (json_valid(`metadata`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'Date et heure de l''interaction',
  `raw_data` longtext DEFAULT NULL COMMENT 'Données brutes de l''interaction (pour débogage)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_interactions`
--

INSERT INTO `user_interactions` (`id`, `user_id`, `entity_type`, `entity_id`, `interaction_type`, `metadata`, `created_at`, `raw_data`) VALUES
(1, 4, 'course', 1, 'rate', '{\"source\": \"search\", \"duration\": 3184}', '2025-06-17 03:04:03', NULL),
(2, 4, 'course', 2, 'rate', '{\"source\": \"search\", \"duration\": 1073}', '2025-06-08 03:04:03', NULL),
(3, 4, 'course', 3, 'complete', '{\"source\": \"search\", \"duration\": 2974}', '2025-06-27 03:04:03', NULL),
(4, 4, 'lesson', 1, 'view', '{\"duration\": 401, \"completion\": false}', '2025-06-17 03:04:03', NULL),
(5, 4, 'lesson', 2, 'download', '{\"duration\": 90, \"completion\": true}', '2025-06-27 03:04:03', NULL),
(6, 4, 'lesson', 3, 'click', '{\"duration\": 1615, \"completion\": true}', '2025-06-23 03:04:03', NULL),
(7, 4, 'lesson', 4, 'view', '{\"duration\": 1687, \"completion\": false}', '2025-06-10 03:04:03', NULL),
(8, 4, 'lesson', 5, 'rate', '{\"duration\": 235, \"completion\": true}', '2025-06-24 03:04:03', NULL),
(9, 5, 'course', 1, 'click', '{\"source\": \"recommendation\", \"duration\": 69}', '2025-06-15 03:04:03', NULL),
(10, 5, 'course', 2, 'complete', '{\"source\": \"search\", \"duration\": 2960}', '2025-06-17 03:04:03', NULL),
(11, 5, 'course', 3, 'rate', '{\"source\": \"recommendation\", \"duration\": 2917}', '2025-06-24 03:04:03', NULL),
(12, 5, 'lesson', 1, 'view', '{\"duration\": 1351, \"completion\": false}', '2025-06-06 03:04:03', NULL),
(13, 5, 'lesson', 2, 'view', '{\"duration\": 1328, \"completion\": true}', '2025-06-29 03:04:03', NULL),
(14, 5, 'lesson', 3, 'view', '{\"duration\": 734, \"completion\": true}', '2025-06-11 03:04:03', NULL),
(15, 5, 'lesson', 4, 'download', '{\"duration\": 1345, \"completion\": true}', '2025-06-05 03:04:03', NULL),
(16, 5, 'lesson', 5, 'download', '{\"duration\": 762, \"completion\": true}', '2025-06-06 03:04:03', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_progress`
--

CREATE TABLE `user_progress` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `lesson_id` int(11) DEFAULT NULL,
  `is_completed` tinyint(1) NOT NULL DEFAULT 0,
  `completion_percentage` float NOT NULL DEFAULT 0 COMMENT 'Pourcentage de 0.0 à 100.0',
  `last_accessed` datetime NOT NULL DEFAULT current_timestamp(),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_progress`
--

INSERT INTO `user_progress` (`id`, `user_id`, `course_id`, `lesson_id`, `is_completed`, `completion_percentage`, `last_accessed`, `created_at`, `updated_at`) VALUES
(1, 4, 1, 5, 0, 20.5049, '2025-07-04 03:04:03', '2025-07-04 03:04:03', '2025-07-05 19:58:55'),
(2, 5, 1, 12, 0, 83.9257, '2025-07-04 03:04:03', '2025-07-04 03:04:03', '2025-07-05 19:59:07'),
(3, 4, 2, 12, 0, 34.4903, '2025-07-04 03:04:03', '2025-07-04 03:04:03', '2025-07-05 19:59:13'),
(4, 5, 3, 17, 0, 13.7416, '2025-07-04 03:04:03', '2025-07-04 03:04:03', '2025-07-05 19:59:20'),
(5, 6, 1, NULL, 0, 0, '2025-07-17 03:18:37', '2025-07-17 03:18:37', NULL),
(6, 6, 2, NULL, 0, 0, '2025-07-17 03:19:56', '2025-07-17 03:19:56', NULL),
(7, 2, 1, NULL, 0, 0, '2025-07-20 04:24:33', '2025-07-20 04:24:33', NULL),
(8, 2, 2, NULL, 0, 0, '2025-07-20 04:26:12', '2025-07-20 04:26:12', NULL),
(9, 5, 2, NULL, 0, 0, '2025-07-24 01:45:42', '2025-07-24 01:45:42', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_quiz_answers`
--

CREATE TABLE `user_quiz_answers` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `quiz_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `option_id` int(11) DEFAULT NULL,
  `answer_text` text DEFAULT NULL,
  `is_correct` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_quiz_results`
--

CREATE TABLE `user_quiz_results` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `quiz_id` int(11) NOT NULL,
  `score` float NOT NULL COMMENT 'Score en pourcentage',
  `passed` tinyint(1) NOT NULL DEFAULT 0,
  `completed_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_quiz_results`
--

INSERT INTO `user_quiz_results` (`id`, `user_id`, `quiz_id`, `score`, `passed`, `completed_at`) VALUES
(1, 4, 1, 33.3333, 0, '2025-07-08 17:01:26'),
(2, 4, 3, 82.986, 1, '2025-07-04 03:04:03'),
(3, 5, 2, 67.102, 0, '2025-07-04 03:04:03'),
(4, 5, 3, 76.3081, 1, '2025-07-04 03:04:03'),
(5, 5, 4, 67.8487, 0, '2025-07-04 03:04:03'),
(6, 4, 7, 95.3911, 1, '2025-07-04 03:04:03'),
(7, 4, 9, 75.7147, 1, '2025-07-04 03:04:03'),
(8, 5, 12, 0, 0, '2025-07-05 23:28:41'),
(9, 5, 13, 56.4952, 0, '2025-07-04 03:04:03'),
(10, 5, 14, 40, 0, '2025-07-07 09:43:57'),
(11, 5, 15, 68.2762, 0, '2025-07-04 03:04:03'),
(12, 5, 7, 40, 0, '2025-07-05 23:25:21'),
(14, 5, 1, 0, 0, '2025-07-08 02:50:02'),
(15, 5, 5, 40, 0, '2025-07-24 02:23:42'),
(16, 5, 6, 60, 0, '2025-07-24 03:54:12');

-- --------------------------------------------------------

--
-- Table structure for table `user_recommendations`
--

CREATE TABLE `user_recommendations` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `score` float NOT NULL COMMENT 'Score de pertinence',
  `reason` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_recommendations`
--

INSERT INTO `user_recommendations` (`id`, `user_id`, `course_id`, `score`, `reason`, `created_at`) VALUES
(1, 4, 3, 0.565332, 'Basé sur vos intérêts en Langues', '2025-07-04 03:04:03'),
(2, 5, 2, 0.846985, 'Basé sur vos intérêts en Informatique', '2025-07-04 03:04:03');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `alembic_version`
--
ALTER TABLE `alembic_version`
  ADD PRIMARY KEY (`version_num`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_slug` (`slug`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_instructor` (`instructor_id`),
  ADD KEY `idx_category` (`category_id`);

--
-- Indexes for table `course_prerequisites`
--
ALTER TABLE `course_prerequisites`
  ADD PRIMARY KEY (`course_id`,`prerequisite_id`),
  ADD KEY `prerequisite_id` (`prerequisite_id`);

--
-- Indexes for table `course_student`
--
ALTER TABLE `course_student`
  ADD PRIMARY KEY (`course_id`,`student_id`),
  ADD KEY `student_id` (`student_id`);

--
-- Indexes for table `course_tags`
--
ALTER TABLE `course_tags`
  ADD PRIMARY KEY (`course_id`,`tag_id`),
  ADD KEY `tag_id` (`tag_id`);

--
-- Indexes for table `discussions`
--
ALTER TABLE `discussions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `ix_discussions_id` (`id`);

--
-- Indexes for table `discussion_participants`
--
ALTER TABLE `discussion_participants`
  ADD PRIMARY KEY (`user_id`,`discussion_id`),
  ADD KEY `discussion_id` (`discussion_id`);

--
-- Indexes for table `lessons`
--
ALTER TABLE `lessons`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_course` (`course_id`),
  ADD KEY `idx_module` (`module_id`),
  ADD KEY `idx_order` (`order_index`);

--
-- Indexes for table `lesson_completions`
--
ALTER TABLE `lesson_completions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_lesson` (`user_id`,`lesson_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_lesson` (`lesson_id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `discussion_id` (`discussion_id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `ix_messages_id` (`id`);

--
-- Indexes for table `message_reads`
--
ALTER TABLE `message_reads`
  ADD PRIMARY KEY (`id`),
  ADD KEY `message_id` (`message_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `modules`
--
ALTER TABLE `modules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_course` (`course_id`),
  ADD KEY `idx_order` (`order_index`);

--
-- Indexes for table `quizzes`
--
ALTER TABLE `quizzes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_lesson` (`lesson_id`);

--
-- Indexes for table `quiz_options`
--
ALTER TABLE `quiz_options`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_question` (`question_id`);

--
-- Indexes for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_quiz` (`quiz_id`),
  ADD KEY `idx_order` (`order_index`);

--
-- Indexes for table `resources`
--
ALTER TABLE `resources`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_lesson` (`lesson_id`),
  ADD KEY `idx_type` (`type`);

--
-- Indexes for table `tags`
--
ALTER TABLE `tags`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`);

--
-- Indexes for table `user_interactions`
--
ALTER TABLE `user_interactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_entity` (`user_id`,`entity_type`,`entity_id`),
  ADD KEY `idx_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_interaction_type` (`interaction_type`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `user_progress`
--
ALTER TABLE `user_progress`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_course` (`course_id`),
  ADD KEY `idx_lesson` (`lesson_id`);

--
-- Indexes for table `user_quiz_answers`
--
ALTER TABLE `user_quiz_answers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `quiz_id` (`quiz_id`),
  ADD KEY `question_id` (`question_id`),
  ADD KEY `option_id` (`option_id`),
  ADD KEY `ix_user_quiz_answers_id` (`id`);

--
-- Indexes for table `user_quiz_results`
--
ALTER TABLE `user_quiz_results`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_quiz` (`quiz_id`);

--
-- Indexes for table `user_recommendations`
--
ALTER TABLE `user_recommendations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_course` (`course_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `courses`
--
ALTER TABLE `courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `discussions`
--
ALTER TABLE `discussions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `lessons`
--
ALTER TABLE `lessons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `lesson_completions`
--
ALTER TABLE `lesson_completions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `message_reads`
--
ALTER TABLE `message_reads`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `modules`
--
ALTER TABLE `modules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `quizzes`
--
ALTER TABLE `quizzes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `quiz_options`
--
ALTER TABLE `quiz_options`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=223;

--
-- AUTO_INCREMENT for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=63;

--
-- AUTO_INCREMENT for table `resources`
--
ALTER TABLE `resources`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `tags`
--
ALTER TABLE `tags`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `user_interactions`
--
ALTER TABLE `user_interactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `user_progress`
--
ALTER TABLE `user_progress`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `user_quiz_answers`
--
ALTER TABLE `user_quiz_answers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_quiz_results`
--
ALTER TABLE `user_quiz_results`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `user_recommendations`
--
ALTER TABLE `user_recommendations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `courses`
--
ALTER TABLE `courses`
  ADD CONSTRAINT `courses_ibfk_1` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `courses_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `course_prerequisites`
--
ALTER TABLE `course_prerequisites`
  ADD CONSTRAINT `course_prerequisites_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `course_prerequisites_ibfk_2` FOREIGN KEY (`prerequisite_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `course_student`
--
ALTER TABLE `course_student`
  ADD CONSTRAINT `course_student_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `course_student_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `course_tags`
--
ALTER TABLE `course_tags`
  ADD CONSTRAINT `course_tags_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `course_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `discussions`
--
ALTER TABLE `discussions`
  ADD CONSTRAINT `discussions_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `discussion_participants`
--
ALTER TABLE `discussion_participants`
  ADD CONSTRAINT `discussion_participants_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `discussion_participants_ibfk_2` FOREIGN KEY (`discussion_id`) REFERENCES `discussions` (`id`);

--
-- Constraints for table `lessons`
--
ALTER TABLE `lessons`
  ADD CONSTRAINT `lessons_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `lessons_ibfk_2` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `lesson_completions`
--
ALTER TABLE `lesson_completions`
  ADD CONSTRAINT `lesson_completions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `lesson_completions_ibfk_2` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`discussion_id`) REFERENCES `discussions` (`id`),
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `message_reads`
--
ALTER TABLE `message_reads`
  ADD CONSTRAINT `message_reads_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`),
  ADD CONSTRAINT `message_reads_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `modules`
--
ALTER TABLE `modules`
  ADD CONSTRAINT `modules_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quizzes`
--
ALTER TABLE `quizzes`
  ADD CONSTRAINT `quizzes_ibfk_1` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quiz_options`
--
ALTER TABLE `quiz_options`
  ADD CONSTRAINT `quiz_options_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `quiz_questions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  ADD CONSTRAINT `quiz_questions_ibfk_1` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `resources`
--
ALTER TABLE `resources`
  ADD CONSTRAINT `resources_ibfk_1` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_interactions`
--
ALTER TABLE `user_interactions`
  ADD CONSTRAINT `user_interactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_progress`
--
ALTER TABLE `user_progress`
  ADD CONSTRAINT `user_progress_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_progress_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_progress_ibfk_3` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `user_quiz_answers`
--
ALTER TABLE `user_quiz_answers`
  ADD CONSTRAINT `user_quiz_answers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `user_quiz_answers_ibfk_2` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`),
  ADD CONSTRAINT `user_quiz_answers_ibfk_3` FOREIGN KEY (`question_id`) REFERENCES `quiz_questions` (`id`),
  ADD CONSTRAINT `user_quiz_answers_ibfk_4` FOREIGN KEY (`option_id`) REFERENCES `quiz_options` (`id`);

--
-- Constraints for table `user_quiz_results`
--
ALTER TABLE `user_quiz_results`
  ADD CONSTRAINT `user_quiz_results_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_quiz_results_ibfk_2` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_recommendations`
--
ALTER TABLE `user_recommendations`
  ADD CONSTRAINT `user_recommendations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_recommendations_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
