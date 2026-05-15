#pragma once

class BridgeServer;
class DatabaseService;

void RegisterDbHandlers(BridgeServer* bridge, DatabaseService* db);
