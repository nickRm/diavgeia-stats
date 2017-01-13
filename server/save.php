<?php

$json = file_get_contents("php://input");
$file = fopen('../cache/test.json', 'w+');
fwrite($file, $json);
fclose($file);
