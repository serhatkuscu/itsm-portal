FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

COPY ["src/Itsm.Api/Itsm.Api.csproj", "src/Itsm.Api/"]
COPY ["src/Itsm.Application/Itsm.Application.csproj", "src/Itsm.Application/"]
COPY ["src/Itsm.Domain/Itsm.Domain.csproj", "src/Itsm.Domain/"]
COPY ["src/Itsm.Infrastructure/Itsm.Infrastructure.csproj", "src/Itsm.Infrastructure/"]
RUN dotnet restore "src/Itsm.Api/Itsm.Api.csproj"

COPY . .
WORKDIR "/src/src/Itsm.Api"
RUN dotnet build "Itsm.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
RUN dotnet publish "Itsm.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Itsm.Api.dll"]
