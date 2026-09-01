UPDATE `sheep` SET `breed` = CASE abs(random()) % 6
  WHEN 0 THEN 'Merinos Anaç'
  WHEN 1 THEN 'Merinos Erkek'
  WHEN 2 THEN 'Merinos Dişi'
  WHEN 3 THEN 'Kıvırcık Anaç'
  WHEN 4 THEN 'Kıvırcık Erkek'
  ELSE 'Kıvırcık Dişi'
END
WHERE `breed` NOT IN ('Merinos Anaç', 'Merinos Erkek', 'Merinos Dişi', 'Kıvırcık Anaç', 'Kıvırcık Erkek', 'Kıvırcık Dişi');

