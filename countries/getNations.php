<?php
require_once ('constants_live.php'); 

	//dB connection to get all violations
		//dB connection to get all violations
	$db = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
	if (mysqli_connect_errno()) {
			printf("Connect failed: %s", mysqli_connect_error());
			exit;
	}
	$qNations = "SELECT b.Country, a.CountryCode, a.population, a.GDP, a.Income_level, b.Name, b.Age, b.Occupation, b.Origin, b.Neighborhood, b.Heading, b.Quote, b.Factoid, b.Notes FROM countries a, people b where a.CountryID = b.CountryID order by a.Country";
	$result = $db->query($qNations);
	
	while($row = $result->fetch_array(MYSQLI_ASSOC)) {
		$data[] = $row;
	}
	
	$db->close();
	echo json_encode($data);

?>