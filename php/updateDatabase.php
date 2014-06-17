<?PHP
require_once ('constants_live.php'); 

function getURL($url)
{
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $url);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
	$output = curl_exec($ch);
	curl_close($ch);  
	return $output;
}

$db = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);

if (mysqli_connect_errno()) {
	printf("Connect failed: %s", mysqli_connect_error());
	exit;
}

// Grab most recent data 

$content = getURL("http://ec2-54-205-114-81.compute-1.amazonaws.com/cgi-bin/index.py");
$content = json_decode($content, TRUE);
var_dump($content);

if($content != FALSE) {
	//clear database
	$db->query("TRUNCATE TABLE people");
	
	foreach($content as $country){
		
		// Normalize database encoding
		foreach($country as $key => $value) {
			$country[$key] = $db -> real_escape_string(trim(str_replace("&nbsp;", "", mb_convert_encoding($value, "HTML-ENTITIES", "UTF-8"))));
		}
		
		echo $db->query("INSERT INTO people 
								(`Country`, 
								`Name`, 
								`Age`, 
								`Occupation`, 
								`Origin`, 
								`Neighborhood`, 
								`Notes`, 
								`Heading`,
								`Activated`) 
					VALUES      (\"" . $country["Country"] . "\",
								\"" . $country["Name"] . "\",
								\"" . $country["Age"] . "\",
								\"" . $country["Occupation"] . "\",
								\"" . $country["Origin"] . "\",
								\"" . $country["Current neighborhood"] . "\",
								\"" . $country["Story text"] . "\",
								\"" . $country["Story title"] . "\",
								\"" . ($country["Active?"] == "" ? "0" : "1") . "\"
								)");
		echo "Uploaded " . $country["Country"] . "<br />";
	}
	echo $mysqli->error;
}


?>