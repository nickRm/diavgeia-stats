<?php

require_once 'Request.php';

class ApiResponse {
    public $code = 200;
    public $data = null;

    function __construct($code, $data) {
        $this->code = $code;
        $this->data = $data;
    }
}

class OpenDataClient {
    public function __construct() {
        $this->baseUrl = 'https://diavgeia.gov.gr/opendata';
        $this->resetAuth();
    }

    public function setBaseUrl($url) {
        $this->baseUrl = $url;
        $this->auth = false;
        $this->username = null;
        $this->password = null;
    }

    public function setAuth($username, $password) {
        $this->auth = true;
        $this->username = $username;
        $this->password = $password;
    }

    public function resetAuth() {
        $this->auth = false;
        $this->username = null;
        $this->password = null;
    }

    public function getResource($resource) {
        $req = new Http_Request($this->baseUrl . $resource, array('method'=>HTTP_REQUEST_METHOD_GET));
        $req->addHeader('Connection', 'Keep-Alive');
        $req->addHeader('Accept', 'application/json');

        if(!PEAR::isError($req->sendRequest())) {
            $responseCode = $req->getResponseCode();
            $responseBody = $req->getResponseBody();
            $data = null;

            if($responseCode === 200) {
                $data = $responseBody;
            }

            return new ApiResponse($responseCode, $data);
        }
        else {
            throw new Exception("Error while getting resource $resource");
        }
    }
}
