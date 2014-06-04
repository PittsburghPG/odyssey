<?php
require_once ('constants_live.php'); 
$first = $last = $country = $neighborhood = $contact = $about = ""; //intialize to empty

    if(isset($_POST['first'])){ $first = test_input($_POST['first']); } 
	if(isset($_POST['last'])){ $last = test_input($_POST['last']); } 
	if(isset($_POST['country'])){ $country = test_input($_POST['country']); } 
	if(isset($_POST['neighborhood'])){ $neighborhood = test_input($_POST['neighborhood']); } 
	if(isset($_POST['contact'])){ $contact = test_input($_POST['contact']); } 
	if(isset($_POST['about'])){ $about = test_input($_POST['about']); } 
	
	
	$db = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
                if (mysqli_connect_errno()) {
                        printf("Connect failed: %s", mysqli_connect_error());
                        exit;
                }

	
    $q = "Insert into tellus(`First`, `Last`, `Country`, `Contact`, `Neighborhood`, `About`) values ('" . $first . "', '" . $last . "', '" . $country . "', '" . $neighborhood . "', '" . $contact . "', '" .  $about ."')";
	echo $q;
    if ($db->query($q)) {
		$response["message"] = "Loaded data.";
		echo json_encode($response);
		
		 
	} else {
		$response["message"] = "An error occurred.";
		echo json_encode($response);
       
	}
   $db->close();

function test_input($data)
	{
	  $data = trim($data);
	  $data = stripslashes($data);
	  $data = htmlspecialchars($data);
	  return $data;
	}
?>