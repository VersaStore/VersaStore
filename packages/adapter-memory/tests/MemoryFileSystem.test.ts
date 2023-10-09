import { MemoryFileSystem } from '../src';
import type { InitialState } from '@versastore/core/tests/FileSystemInterfaceTest';
import { FileSystemInterfaceTest } from '@versastore/core/tests/FileSystemInterfaceTest';

FileSystemInterfaceTest<MemoryFileSystem, object>(
    MemoryFileSystem.name,
    async (initialState: InitialState) => ({
        fs: new MemoryFileSystem(initialState),
        lifetimeOpts: {},
    }),
);
