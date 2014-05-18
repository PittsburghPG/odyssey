<?php
require_once ('constants_live.php'); 
	
	
$db = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
if (mysqli_connect_errno()) {
		printf("Connect failed: %s", mysqli_connect_error());
		exit;
}
$term = trim(strip_tags($_GET['query'])); 

//build a query on the database
$q = "select Country from people where ((Name = ' ') OR (Name = '')) AND (Country LIKE '%" . $term . "%') order by Country asc";
$result = $db->query($q);
//devbridge autocomplete needs the results to be formatted a particular way:
$reply = array();
$reply['query'] = $term;
$reply['suggestions'] = array();

while($row = $result->fetch_array(MYSQLI_ASSOC)) {
	//Add this row to the reply
    $reply['suggestions'][]=htmlentities(stripslashes($row['Country']));
}

$db->close();
echo json_encode($reply);
?>