class Solution:
    def __init__(self):
        self.root = {'dirs': {}, 'files': {}}
        
    def _resolve_path(self, path):
        if not path or path == '/':
            return self.root, ''
            
        # Remove leading slash if present
        if path.startswith('/'):
            path = path[1:]
            
        parts = path.split('/')
        current = self.root
        
        # Handle the case where the path is a file in the root
        if len(parts) == 1 and parts[0] in current['files']:
            return current, parts[0]
            
        # Navigate through directories
        for part in parts[:-1]:
            if part not in current['dirs']:
                return None, None
            current = current['dirs'][part]
            
        return current, parts[-1] if parts else ''

    def ls(self, path: str):
        # Handle root directory
        if path == '/':
            dirs = sorted(list(self.root['dirs'].keys()))
            files = sorted(list(self.root['files'].keys()))
            # List directories first, then files (both in lexicographical order)
            result = dirs + files
            # Debug print
            print(f"DEBUG - root ls: dirs={dirs}, files={files}, result={result}")
            print(f"DEBUG - root object: {self.root}")
            return result
            
        # Handle empty path
        if not path:
            return []
            
        # Normalize the path
        path = path.rstrip('/')
        
        # Split the path into components
        parts = [p for p in path.split('/') if p]
        current = self.root
        
        # Try to find the file or directory
        for i, part in enumerate(parts):
            # If this is the last part and it's a file, return it
            if i == len(parts) - 1 and part in current['files']:
                return [part]
            # If it's a directory, navigate into it
            if part in current['dirs']:
                current = current['dirs'][part]
            else:
                # Path doesn't exist
                return []
        
        # List contents of the current directory
        dirs = sorted(list(current['dirs'].keys()))
        files = sorted(list(current['files'].keys()))
        
        # Debug print
        print(f"DEBUG - ls('{path}'): dirs={dirs}, files={files}")
        
        # Always include both directories and files in the result
        return dirs + files

    def mkdir(self, path: str) -> None:
        if path == '/':
            return
            
        current = self.root
        parts = [p for p in path.split('/') if p]
        for part in parts:
            if part not in current['dirs']:
                current['dirs'][part] = {'dirs': {}, 'files': {}}
            current = current['dirs'][part]

    def addContentToFile(self, filePath: str, content: str) -> None:
        if not filePath or filePath == '/':
            return
            
        # Normalize the path
        path = filePath[1:] if filePath.startswith('/') else filePath
        parts = path.split('/')
        filename = parts[-1]
        
        # If the path is just a filename, add it to the root
        if len(parts) == 1:
            if filename not in self.root['files']:
                self.root['files'][filename] = ''
            self.root['files'][filename] += content
            # Debug print
            print(f"DEBUG - Added file to root: {filename}, content: {self.root['files'][filename]}")
            return
            
        # Create all parent directories
        dir_path = '/'.join(parts[:-1])
        if dir_path:
            self.mkdir('/' + dir_path)
        
        # Get the parent directory
        parent = self.root
        for part in parts[:-1]:
            if part in parent['dirs']:
                parent = parent['dirs'][part]
            else:
                # This should not happen since we just created the directory
                print(f"ERROR: Failed to find directory {part} in path {filePath}")
                return
        
        # Add or update the file
        if filename not in parent['files']:
            parent['files'][filename] = ''
        parent['files'][filename] += content
        # Debug print
        print(f"DEBUG - Added file to {filePath}, content: {parent['files'][filename]}")

    def readContentFromFile(self, filePath: str) -> str:
        if not filePath or filePath == '/':
            return ''
            
        # Normalize the path
        path = filePath[1:] if filePath.startswith('/') else filePath
        parts = path.split('/')
        
        # Start from root
        current = self.root
        
        # Navigate to the parent directory
        for part in parts[:-1]:
            if part in current['dirs']:
                current = current['dirs'][part]
            else:
                return ''  # Parent directory doesn't exist
        
        # Get the filename
        filename = parts[-1]
        
        # Return the file content if it exists, empty string otherwise
        return current['files'].get(filename, '')
