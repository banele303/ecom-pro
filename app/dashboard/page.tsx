import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardStats } from "../components/dashboard/DashboardStats";
import { RecentSales, OrderWithUser } from "../components/dashboard/RecentSales";
import { Chart } from "../components/dashboard/Chart";
import { MostViewedProducts } from "../components/dashboard/MostViewedProducts";
import { CategoryDistribution } from "../components/dashboard/CategoryDistribution";
import { prisma } from "@/lib/db";
import { unstable_noStore as noStore } from "next/cache";

type TransactionData = {
  amount: number;
  createdAt: Date;
};

type TransactionResult = {
  date: string;
  revenue: number;
};

type ProductData = {
  id: string;
  name: string;
  images: string[];
  category: string;
  views: number | null;
};

type ProductResult = {
  id: string;
  name: string;
  image: string;
  views: number;
  category: string;
};

type CategoryData = {
  category: string;
  _count: {
    category: number;
  };
};

type CategoryResult = {
  name: string;
  value: number;
};

async function getData() {
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  const [transactionData, mostViewedProducts, categoryData, recentSales] = await Promise.all([
    // Transaction data
    prisma.order.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        amount: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    }),

    // Most viewed products
    prisma.product.findMany({
      select: {
        id: true,
        name: true,
        images: true,
        category: true,
        views: true,
      },
      orderBy: {
        views: 'desc',
      },
      take: 5,
    }),

    // Category distribution
    prisma.product.groupBy({
      by: ['category'],
      _count: {
        category: true,
      },
    }),

    // Recent sales
    prisma.order.findMany({
      select: {
        amount: true,
        id: true,
        user: {
          select: {
            firstName: true,
            profileImage: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 7,
    }),
  ]);

  const transactionResult = transactionData.map((item: TransactionData): TransactionResult => ({
    date: new Intl.DateTimeFormat("en-US").format(item.createdAt),
    revenue: item.amount / 100,
  }));

  const mostViewedProductsResult = mostViewedProducts.map((product: ProductData): ProductResult => ({
    id: product.id,
    name: product.name,
    image: product.images[0],
    views: product.views ?? 0,
    category: product.category,
  }));

  const categoryDistributionResult = categoryData.map((item: CategoryData): CategoryResult => ({
    name: item.category,
    value: item._count.category,
  }));

  return {
    transactionResult,
    mostViewedProductsResult,
    categoryDistributionResult,
    recentSales: recentSales as OrderWithUser[],
  };
}

export default async function Dashboard() {
  noStore();
  const { transactionResult, mostViewedProductsResult, categoryDistributionResult, recentSales } = await getData();

  return (
    <>
      <DashboardStats />

      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3 mt-10">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              Recent transactions from the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Chart data={transactionResult} />
          </CardContent>
        </Card>

        <RecentSales data={recentSales} />
      </div>

      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 mt-10">
        <MostViewedProducts products={mostViewedProductsResult} />
        <CategoryDistribution data={categoryDistributionResult} />
      </div>
    </>
  );
}
