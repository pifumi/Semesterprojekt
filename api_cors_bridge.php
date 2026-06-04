<?php

//lat und lon übernehmen
$lat = $_GET['lat'];
$lon = $_GET['lon'];
// api-url
$url = "https://api.open-meteo.com/v1/forecast?latitude=$lat&longitude=$lon&current=temperature_2m,weather_code,is_day,cloud_cover&timezone=Europe/Zurich"; // url der api mit cors-problemen, z.B. https://leafletjs.com/reference.html

// do request
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_FAILONERROR => true
]);
$response = curl_exec($ch);

// error handling
if ($response === false) {
    http_response_code(500);
    echo json_encode([
        'error' => curl_error($ch)
    ]);
    curl_close($ch);
    exit;
}

// end request
curl_close($ch);

// return as JSON
header('Content-Type: application/json; charset=utf-8');
echo $response;