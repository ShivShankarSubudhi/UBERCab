<?php 
$response_array = array();
$response_array['success'] = false;
function clean_input($data) {
    $data = htmlspecialchars_decode($data);
    $data = strip_tags($data);
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}
if($_SERVER['REQUEST_METHOD'] == 'POST'){
    $to = clean_input($_POST['email']); 
    $to = "somebody@example.com";
    $subject = "UBER CAB BOOKING";
    $msg = clean_input($_POST['message'])
    $headers = "From: booking@uber.com" ;
    mail($to,$subject,$msg,$headers);
    $response_array['success'] = true;
}
header("Content-type: application/json");
echo json_encode($response_array);






?>