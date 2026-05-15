#pragma once

class BridgeServer;
class DatabaseService;
class ContentCache;

void RegisterFileHandlers(BridgeServer* bridge, DatabaseService* db, ContentCache* cache);
