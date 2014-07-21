<?php

require_once ('constants_live.php'); 
$db = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
if (mysqli_connect_errno()) {
	printf("Connect failed: %s", mysqli_connect_error());
	exit;
}

switch($_GET["operation"]) {
	case "getSingleCountry":
		$qNations = "SELECT Country, Name, Age, Occupation, Origin, Neighborhood, Heading, Notes FROM people where Country = '" . $_GET["country"] .  "' order by Country";
	break;
	
	case "getActiveCountries":
		$qNations = "SELECT Country, Activated, DatePublished, LENGTH(Notes) as Count from people ORDER BY Country";
	break;
	
	case "getInactiveCountries":
		$qNations = "SELECT Country from people WHERE Activated = '' ORDER BY Country";
	break;
	
	case "getNextCountry":
		$qNations = "SELECT Country, Name from people where Country > '" . $_GET["country"] . "' AND Activated = 1 ORDER BY Country LIMIT 1";
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