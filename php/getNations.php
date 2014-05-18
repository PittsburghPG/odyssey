<?php

require_once ('constants_live.php'); 
$db = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
if (mysqli_connect_errno()) {
	printf("Connect failed: %s", mysqli_connect_error());
	exit;
}

switch($_GET["operation"]) {
	case "getSingleCountry":
		$qNations = "SELECT Country, Name, Age, Occupation, Origin, Neighborhood, Heading, Notes FROM people where Country LIKE '" . $_GET["country"] .  "' order by Country";
	break;
	
	case "getActiveCountries":
		$qNations = "SELECT Country, LENGTH(Notes) as Count from people ORDER BY Country";
	break;
	
	default:
		$qNations = "SELECT Country, Name, Age, Occupation, Origin, Neighborhood, Heading, Notes FROM people order by Country";
	break;
	
}

$result = $db->query($qNations);

while($row = $result->fetch_array(MYSQLI_ASSOC)) {
	$data[] = $row;
}

$db->close();
echo json_encode($data);

?>