
SET NAMES utf8mb4;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,                 
  role ENUM('student','teacher') NULL,
  occupation VARCHAR(50) NOT NULL DEFAULT 'Student',
  field VARCHAR(50) NOT NULL DEFAULT 'History',
  institution VARCHAR(150) NOT NULL DEFAULT '',
  subscribed TINYINT(1) NOT NULL DEFAULT 0,
  free_used INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE consents (                            
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  policy_version VARCHAR(20) NOT NULL,
  marketing TINYINT(1) NOT NULL DEFAULT 0,
  is_minor TINYINT(1) NOT NULL DEFAULT 0,
  guardian_email VARCHAR(190) NULL,
  given_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE modules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  memo MEDIUMTEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_module (user_id, name),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sessions_marked (                    
  id INT AUTO_INCREMENT PRIMARY KEY,
  module_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  question_count INT NOT NULL,
  marked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE session_rows (                       
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  student_name VARCHAR(120) NOT NULL,
  scores JSON NOT NULL,                            
  FOREIGN KEY (session_id) REFERENCES sessions_marked(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  occupation VARCHAR(50) NOT NULL,
  field VARCHAR(50) NOT NULL,
  members INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id INT NOT NULL,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_room (room_id, id),
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  article_id INT NOT NULL,
  user_id INT NOT NULL,
  body VARCHAR(1000) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_article (article_id),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE privacy_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL,
  type VARCHAR(100) NOT NULL,
  details TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE login_attempts (                      
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL,
  ip VARCHAR(45) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_email_time (email, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


INSERT INTO rooms (name, occupation, field, members) VALUES
 ('Grade 12 History Study Group','Student','History',128),
 ('Lecturers: History Teaching','Lecturer','History',41),
 ('IT Students Hub','Student','IT',214),
 ('Developers in Durban','Developer','IT',77),
 ('Life Sciences Revision','Student','Life Sciences',96),
 ('Teachers: Life Sciences','Teacher','Life Sciences',53),
 ('Commerce and Accounting','Student','Commerce',88),
 ('Accountants Network','Accountant','Commerce',35),
 ('Nurses and Health Studies','Nurse','Life Sciences',29);
