<?php
/*-------------------------------------------------------------------------
* Name: connect-db.php                                                      *
* Description:  Connect to the database.                                    *
*               $dbc is the variable that will be used in all other php     *
*               pages to make the database connection.                      *
---------------------------------------------------------------------------*/

    // Database credentials
    $host = "localhost";
    $user = "root";
    $pass = "";
    $db = "little_liberators";
    $port = 3306;
    
    // Connect to the database
    $dbc = mysqli_connect($host, $user, $pass, $db, $port);
    
    // Check connection
    if ($dbc->connect_error) {
       die("Connection failed: " . $dbc->connect_error);
    } 
?>