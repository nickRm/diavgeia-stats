<?php

require_once "opendata.php";

$resource = filter_input(INPUT_GET, 'queryString');
$client = new OpenDataClient();
$response = $client->getResource($resource);
if($response->code === 200) {
    print $response->data;
}
else {
    print "Error " . $response->code;
}
